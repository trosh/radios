HOST="files.000webhost.com"
USER="trosh"
read -s -p "trosh.000webhost.com passwd : " PASSWD

ftp -n -v $HOST <<EOF
ascii
user $USER "$PASSWD"
prompt
cd public_html/radios
mput index.html radios.css radios.js
bye
EOF

