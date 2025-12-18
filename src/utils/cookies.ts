import { Request, Response } from 'express';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class Cookies {
  static get(req: Request, name: string): string | undefined {
    return req.cookies[name] as string | undefined;
  }
  static getOptions() {
    return {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    };
  }

  static remove(
    res: Response,
    name: string,
    options?: Partial<ReturnType<typeof Cookies.getOptions>>
  ): void {
    res.clearCookie(name, { ...this.getOptions(), ...options });
  }

  static set(
    res: Response,
    name: string,
    value: string,
    options?: Partial<ReturnType<typeof Cookies.getOptions>>
  ): void {
    res.cookie(name, value, { ...this.getOptions(), ...options });
  }
}

export default Cookies;
