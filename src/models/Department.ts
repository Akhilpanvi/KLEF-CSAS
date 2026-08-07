import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const DepartmentSchema = new Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

DepartmentSchema.index({ name: "text", code: "text" });

export type DepartmentDoc = InferSchemaType<typeof DepartmentSchema>;

export const Department: Model<DepartmentDoc> =
  models.Department || model<DepartmentDoc>("Department", DepartmentSchema);
