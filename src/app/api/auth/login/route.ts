import { NextRequest } from "next/server";
import { z } from "zod";
import { User } from "@/models/User";
import { Department } from "@/models/Department";
import { dbConnect } from "@/lib/db/connect";
import { ok, fail, handleApiError } from "@/lib/api-response";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionCookie } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, password } = loginSchema.parse(await req.json());

    const user = await User.findOne({ email, isActive: true });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return fail("Invalid email or password", 401);
    }

    let departmentCode: string | undefined;
    if (user.department) {
      const dept = await Department.findById(user.department, { code: 1 }).lean();
      departmentCode = dept?.code;
    }

    await createSessionCookie({
      sub: String(user._id),
      role: user.role,
      name: user.name,
      department: user.department ? String(user.department) : undefined,
      departmentCode,
    });

    return ok({ name: user.name, role: user.role, departmentCode });
  } catch (err) {
    return handleApiError(err);
  }
}
