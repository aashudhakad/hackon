import { User, IUser } from '../models/User';

export class UserRepository {
  /**
   * Create a new user with email, password, and username (local auth).
   */
  async createUser(email: string, password: string, username: string): Promise<IUser> {
    const user = new User({ email, password, username, authProvider: 'local' });
    return user.save();
  }

  /**
   * Find a user by email (includes password field for authentication).
   */
  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return User.findOne({ email }).select('+password').exec();
  }

  /**
   * Find a user by email (excludes password field).
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email }).exec();
  }

  /**
   * Find a user by Google ID.
   */
  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return User.findOne({ googleId }).exec();
  }

  /**
   * Find a user by ID (excludes password field).
   */
  async findById(userId: string): Promise<IUser | null> {
    return User.findById(userId).exec();
  }

  /**
   * Check if a user with the given email exists.
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await User.countDocuments({ email }).exec();
    return count > 0;
  }
}

export const userRepository = new UserRepository();
