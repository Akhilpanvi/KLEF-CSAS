import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";
import { ROLES } from "@/lib/auth/roles";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },
    department: { type: Schema.Types.ObjectId, ref: "Department" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

UserSchema.pre("validate", function () {
  if (this.role === "DEPARTMENT_USER" && !this.department) {
    throw new Error("DEPARTMENT_USER requires a department");
  }
});

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: Types.ObjectId };
export const User: Model<UserDoc> = models.User || model<UserDoc>("User", UserSchema);
