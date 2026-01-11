#!/usr/bin/env python
import re

with open('app.py', 'r') as f:
    content = f.read()

pos = content.find("@app.route('/admin/register'")
if pos > 0:
    login_code = """    @app.route('/admin/login', methods=['GET', 'POST'])
    def admin_login():
        error = None
        if request.method == 'POST':
            email = request.form.get('email', '').strip().lower()
            password = request.form.get('password', '')
            admin = Admin.query.filter_by(email=email).first()
            if admin and admin.check_password(password):
                session['is_admin'] = True
                session['admin_email'] = email
                flash('Logged in as admin.', 'success')
                return redirect(url_for('medicines'))
            else:
                error = 'Invalid email or password.'
        if Admin.query.first() is None:
            return render_template('admin_login.html', error=error, show_register=True)
        return render_template('admin_login.html', error=error, show_register=False)

    @app.route('/admin/logout')
    def admin_logout():
        session.pop('is_admin', None)
        session.pop('admin_email', None)
        flash('Logged out.', 'info')
        return redirect(url_for('index'))

"""
    content = content[:pos] + login_code + content[pos:]
    with open('app.py', 'w') as f:
        f.write(content)
    print('Login/logout routes added successfully')
else:
    print('Could not find admin_register route')
