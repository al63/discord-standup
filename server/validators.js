export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: "Invalid data", details: result.error.issues });
    }
    next();
  };
}
