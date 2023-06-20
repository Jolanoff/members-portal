// validation.js
import { check, validationResult } from 'express-validator';

export const userValidationRules = [
  check('firstName').isAlpha().withMessage('First name should contain only alphabets'),
  
  check('lastName').notEmpty().withMessage('Last name cannot be empty')
  .matches(/^[a-zA-Z\s]*$/).withMessage('Last name should contain only alphabets and spaces')
  .trim().not().isEmpty().withMessage('Last name cannot be just spaces'),
  
  check('email').isEmail().withMessage('Email should be a valid email address'),
];
export const projectValidationRules = [
  check('title').not().isEmpty().withMessage('Project title is required'),
  check('department').not().isEmpty().withMessage('Project department is required'),
  check('subsystem').not().isEmpty().withMessage('Project subsystem is required'),
  check('projectStartDate').not().isEmpty().withMessage('Project start date is required'),
  check('projectEndDate').not().isEmpty().withMessage('Project end date is required'),
];

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array().map(err => err.msg) });
  }
  next();
};
