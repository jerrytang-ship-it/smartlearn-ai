-- Run this in Supabase SQL Editor to add new question types

ALTER TABLE questions DROP CONSTRAINT questions_type_check;
ALTER TABLE questions ADD CONSTRAINT questions_type_check
  CHECK (type IN ('mcq', 'true_false', 'fill_blank', 'ordering', 'match'));
