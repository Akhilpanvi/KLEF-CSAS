import { Schema, model, models, type InferSchemaType, type Model, Types } from "mongoose";

const UnitSchema = new Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    parentDepartment: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

UnitSchema.index({ parentDepartment: 1, code: 1 }, { unique: true });

export type UnitDoc = InferSchemaType<typeof UnitSchema> & { _id: Types.ObjectId };

export const Unit: Model<UnitDoc> = models.Unit || model<UnitDoc>("Unit", UnitSchema);
