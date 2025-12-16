import { Request, Response } from 'express';

class Cookies {
  static getOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    };
  }
  static set(res: Response, name: string, value: string, options: any = {}) {
    try {
      res.cookie(name, value, { ...this.getOptions(), ...options });
    } catch (error) {
      throw error;
    }
  }

  static remove(res: Response, name: string, options: any = {}) {
    try {
      res.clearCookie(name, { ...this.getOptions(), ...options });
    } catch (error) {
      throw error;
    }
  }

  static get(req: Request, name: string) {
    try {
      return req.cookies[name];
    } catch (error) {
      throw error;
    }
  }
}

export default Cookies;
