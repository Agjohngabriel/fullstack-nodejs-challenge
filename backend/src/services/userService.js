const bcrypt = require('bcryptjs');
const database = require('../config/database');
const logger = require('../utils/logger');

class UserService {
  constructor() {
    this.db = null;
  }

  initialize() {
    this.db = database.getDatabase();
  }

  // Hash password
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Compare password
  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Create new user
  async createUser(userData) {
    return new Promise(async (resolve, reject) => {
      try {
        const { email, password, firstName = '', lastName = '' } = userData;

        // Check if user already exists
        const existingUser = await this.getUserByEmail(email);
        if (existingUser) {
          return reject(new Error('User with this email already exists'));
        }

        // Hash password
        const hashedPassword = await this.hashPassword(password);

        const query = `
          INSERT INTO users (email, password, firstName, lastName, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
        `;

        this.db.run(query, [email, hashedPassword, firstName, lastName], function(err) {
          if (err) {
            logger.error('Error creating user:', err);
            reject(new Error('Failed to create user'));
          } else {
            logger.info('User created successfully:', { userId: this.lastID, email });
            resolve({
              id: this.lastID,
              email,
              firstName,
              lastName,
              createdAt: new Date().toISOString()
            });
          }
        });
      } catch (error) {
        logger.error('Create user error:', error);
        reject(error);
      }
    });
  }

  // Get user by email
  async getUserByEmail(email) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE email = ?';
      
      this.db.get(query, [email], (err, row) => {
        if (err) {
          logger.error('Error fetching user by email:', err);
          reject(new Error('Database error'));
        } else {
          resolve(row || null);
        }
      });
    });
  }

  // Get user by ID
  async getUserById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id, email, firstName, lastName, createdAt, updatedAt FROM users WHERE id = ?';
      
      this.db.get(query, [id], (err, row) => {
        if (err) {
          logger.error('Error fetching user by ID:', err);
          reject(new Error('Database error'));
        } else {
          resolve(row || null);
        }
      });
    });
  }

  // Authenticate user
  async authenticateUser(email, password) {
    try {
      const user = await this.getUserByEmail(email);
      
      if (!user) {
        throw new Error('Invalid email or password');
      }

      const isPasswordValid = await this.comparePassword(password, user.password);
      
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      logger.error('Authentication error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateUser(userId, updateData) {
    return new Promise(async (resolve, reject) => {
      try {
        const { firstName, lastName, email } = updateData;
        const updateFields = [];
        const values = [];

        if (firstName !== undefined) {
          updateFields.push('firstName = ?');
          values.push(firstName);
        }

        if (lastName !== undefined) {
          updateFields.push('lastName = ?');
          values.push(lastName);
        }

        if (email !== undefined) {
          // Check if email is already taken by another user
          const existingUser = await this.getUserByEmail(email);
          if (existingUser && existingUser.id !== userId) {
            return reject(new Error('Email is already taken'));
          }
          updateFields.push('email = ?');
          values.push(email);
        }

        if (updateFields.length === 0) {
          return reject(new Error('No fields to update'));
        }

        updateFields.push('updatedAt = datetime(\'now\')');
        values.push(userId);

        const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

        this.db.run(query, values, function(err) {
          if (err) {
            logger.error('Error updating user:', err);
            reject(new Error('Failed to update user'));
          } else if (this.changes === 0) {
            reject(new Error('User not found'));
          } else {
            logger.info('User updated successfully:', { userId });
            resolve({ message: 'User updated successfully' });
          }
        });
      } catch (error) {
        logger.error('Update user error:', error);
        reject(error);
      }
    });
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await this.getUserByEmail((await this.getUserById(userId)).email);
      
      if (!user) {
        throw new Error('User not found');
      }

      const isCurrentPasswordValid = await this.comparePassword(currentPassword, user.password);
      
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      const hashedNewPassword = await this.hashPassword(newPassword);

      return new Promise((resolve, reject) => {
        const query = 'UPDATE users SET password = ?, updatedAt = datetime(\'now\') WHERE id = ?';
        
        this.db.run(query, [hashedNewPassword, userId], function(err) {
          if (err) {
            logger.error('Error changing password:', err);
            reject(new Error('Failed to change password'));
          } else {
            logger.info('Password changed successfully:', { userId });
            resolve({ message: 'Password changed successfully' });
          }
        });
      });
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  // Save user suggestion
  async saveSuggestion(userId, age, healthGoal, suggestions) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO user_suggestions (userId, age, healthGoal, suggestions, createdAt)
        VALUES (?, ?, ?, ?, datetime('now'))
      `;

      this.db.run(query, [userId, age, healthGoal, JSON.stringify(suggestions)], function(err) {
        if (err) {
          logger.error('Error saving suggestion:', err);
          reject(new Error('Failed to save suggestion'));
        } else {
          logger.info('Suggestion saved successfully:', { userId, suggestionId: this.lastID });
          resolve({
            id: this.lastID,
            userId,
            age,
            healthGoal,
            suggestions,
            createdAt: new Date().toISOString()
          });
        }
      });
    });
  }

  // Get user's suggestion history
  async getUserSuggestions(userId, limit = 10) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, age, healthGoal, suggestions, createdAt
        FROM user_suggestions
        WHERE userId = ?
        ORDER BY createdAt DESC
        LIMIT ?
      `;

      this.db.all(query, [userId, limit], (err, rows) => {
        if (err) {
          logger.error('Error fetching user suggestions:', err);
          reject(new Error('Failed to fetch suggestions'));
        } else {
          const suggestions = rows.map(row => ({
            ...row,
            suggestions: JSON.parse(row.suggestions)
          }));
          resolve(suggestions);
        }
      });
    });
  }

  // Delete user account
  async deleteUser(userId) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');

        // Delete user suggestions first (due to foreign key)
        this.db.run('DELETE FROM user_suggestions WHERE userId = ?', [userId], (err) => {
          if (err) {
            this.db.run('ROLLBACK');
            logger.error('Error deleting user suggestions:', err);
            return reject(new Error('Failed to delete user data'));
          }
        });

        // Delete analytics data (set userId to NULL)
        this.db.run('UPDATE analytics SET userId = NULL WHERE userId = ?', [userId], (err) => {
          if (err) {
            this.db.run('ROLLBACK');
            logger.error('Error updating analytics:', err);
            return reject(new Error('Failed to update analytics'));
          }
        });

        // Delete user
        this.db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
          if (err) {
            this.db.run('ROLLBACK');
            logger.error('Error deleting user:', err);
            return reject(new Error('Failed to delete user'));
          }

          if (this.changes === 0) {
            this.db.run('ROLLBACK');
            return reject(new Error('User not found'));
          }

          this.db.run('COMMIT', (err) => {
            if (err) {
              logger.error('Error committing transaction:', err);
              return reject(new Error('Failed to complete deletion'));
            }

            logger.info('User deleted successfully:', { userId });
            resolve({ message: 'User account deleted successfully' });
          });
        });
      });
    });
  }
}

module.exports = new UserService();