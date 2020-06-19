const path = require('path');
const fs = require('fs');

const src = path.join(__dirname, '..',  '.prettierrc');
const dst = path.join(process.cwd(),  '.prettierrc');

if (fs.existsSync(dst)) {
    fs.unlinkSync(dst);
}

fs.symlink(src, dst, err => {
    if (err) {
        console.error(err);
    }
});
