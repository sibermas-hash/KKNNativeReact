import subprocess

try:
    result = subprocess.run([
        'expect', '-c', 
        '''
        set timeout 30
        spawn ssh -o StrictHostKeyChecking=no -p 1977 kampelmas@172.16.2.70 "cd /usr/local/www/apache24/data/sibermas2026 && git status && php artisan env"
        expect "*?assword:*"
        send "KampelM45/.26:\\r"
        expect eof
        '''
    ], capture_output=True, text=True)
    
    with open('/Users/macm4/Documents/Projek/kknuinsaizu/server_status.txt', 'w') as f:
        f.write(result.stdout)
        f.write("\nERRORS:\n")
        f.write(result.stderr)
except Exception as e:
    with open('/Users/macm4/Documents/Projek/kknuinsaizu/server_status.txt', 'w') as f:
        f.write(str(e))
