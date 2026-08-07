import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const SemesterSchema = new Schema(
  {
    number: { type: Number, required: true, unique: true, min: 1 },
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type SemesterDoc = InferSchemaType<typeof SemesterSchema>;

export const Semester: Model<SemesterDoc> =
  models.Semester || model<SemesterDoc>("Semester", SemesterSchema);
