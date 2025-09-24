const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: {
            message: 'Validation error',
            details: error.details.map(detail => detail.message)
          }
        });
      }
      next();
    } catch (error) {
      console.error('Validation Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
};

module.exports = { validateRequest };