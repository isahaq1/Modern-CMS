export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "image"
  | "video"
  | "url"
  | "number"
  | "boolean"
  | "select"
  | "array"
  | "datetime"
  | "color";

export type FieldDescriptor = {
  key: string;
  label: string;
  type: FieldType;
  default?: unknown;
  options?: { label: string; value: string }[]; // for "select"
  itemFields?: FieldDescriptor[]; // for "array" — schema of each item
  min?: number;
  max?: number;
  step?: number; // for "number" — e.g. 0.1 for a speed/opacity slider-style field
  placeholder?: string;
};
