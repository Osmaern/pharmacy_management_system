# TODO for Medicine Stock Indication

## Completed Tasks
- [x] Update templates/medicines.html to display "Finish" in red for medicines with zero quantity
- [x] Run the Flask app successfully (app starts without errors)

# Project Improvement Plan

## Security Enhancements
- [x] Replace hardcoded secret key with environment variables
- [x] Implement CSRF protection using Flask-WTF
- [x] Add rate limiting for login attempts
- [x] Sanitize user inputs to prevent XSS
- [ ] Prepare for HTTPS in production

## Code Quality & Architecture
- [ ] Separate routes into blueprints for better organization
- [ ] Add proper error handling and logging
- [ ] Implement database migrations with Flask-Migrate
- [ ] Add unit tests with pytest
- [ ] Use environment variables for configuration

## UI/UX Improvements
- [ ] Add search and filtering to medicine list
- [ ] Implement pagination for large datasets
- [ ] Add responsive design improvements
- [ ] Include loading states and better feedback
- [ ] Add data export functionality (CSV/PDF)

## Feature Additions
- [ ] Add barcode scanning for medicines
- [ ] Implement inventory alerts via email
- [ ] Add prescription management
- [ ] Include supplier management
- [ ] Add multi-user roles (pharmacist, manager)

## Performance Optimizations
- [ ] Add database indexing for common queries
- [ ] Implement caching for frequently accessed data
- [ ] Optimize database queries to reduce N+1 problems
