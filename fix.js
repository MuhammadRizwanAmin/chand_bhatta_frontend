const fs = require('fs');
const path = require('path');

const targetDir = 'd:/projects/oncloudhotel/src/app/pages';

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

walk(targetDir, function(filePath) {
    if (filePath.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        if (content.includes('canEditOrDelete')) {
            // 1. Replace destructuring: `const { canEditOrDelete } = usePermissions();`
            // Sometimes it has other variables like `const { canEditOrDelete, user } = usePermissions();`
            content = content.replace(/canEditOrDelete/g, 'canEdit, canDelete');

            // Now `content` has `{canEdit, canDelete && ...}` which is a syntax error.
            // Let's revert that and do it properly.
            content = originalContent;

            // Fix destructuring
            content = content.replace(/const\s*\{\s*([^}]*?)\s*\}\s*=\s*usePermissions\s*\(\s*\)\s*;/g, (match, vars) => {
                if (vars.includes('canEditOrDelete')) {
                    let newVars = vars.replace('canEditOrDelete', 'canEdit, canDelete');
                    return `const { ${newVars} } = usePermissions();`;
                }
                return match;
            });

            // 2. Replace {canEditOrDelete && (<> ... </>)}
            // We look for patterns where there are edit and delete buttons inside.
            let regexFragment = /\{canEditOrDelete\s*&&\s*\(\s*(?:<>|<React\.Fragment>)([\s\S]*?)<\/(?:>|React\.Fragment)>\s*\)\s*\}/g;
            
            content = content.replace(regexFragment, (match, inner) => {
                // `inner` usually contains two <button>s or <DropdownMenu.Item>s.
                // One for Edit, one for Delete.
                // Let's split them by looking for `<button` or `<DropdownMenu.Item` and their closing tags.
                let parts = [];
                let tagRegex = /<([a-zA-Z0-9_.-]+)[^>]*>[\s\S]*?<\/\1>/g;
                let tags = [];
                let m;
                while ((m = tagRegex.exec(inner)) !== null) {
                    tags.push(m[0]);
                }

                if (tags.length >= 2) {
                    let editTags = tags.filter(t => t.toLowerCase().includes('edit') || t.toLowerCase().includes('update'));
                    let deleteTags = tags.filter(t => t.toLowerCase().includes('delete') || t.toLowerCase().includes('trash'));
                    
                    if (editTags.length > 0 && deleteTags.length > 0) {
                        return `{canEdit && (<>${editTags.join('\\n')}</>)}\n{canDelete && (<>${deleteTags.join('\\n')}</>)}`;
                    }
                }
                
                // If we couldn't split perfectly, we replace with canDelete just for safety?
                // Or try to manually split. Most inner blocks are just 2 buttons.
                // Let's just wrap the inner with canEdit, and if there's a delete, wrap it with canDelete.
                // A better approach is to wrap edit items in canEdit and delete items in canDelete.
                let res = inner;
                res = res.replace(/(<([a-zA-Z0-9_.-]+)[^>]*>[\s\S]*?<\/\2>)/g, (buttonMatch) => {
                    if (buttonMatch.toLowerCase().includes('delete') || buttonMatch.toLowerCase().includes('trash')) {
                        return `{canDelete && (${buttonMatch})}`;
                    } else if (buttonMatch.toLowerCase().includes('edit') || buttonMatch.toLowerCase().includes('update')) {
                        return `{canEdit && (${buttonMatch})}`;
                    }
                    return buttonMatch; // leave as is
                });
                return `<>${res}</>`; // Remove the `{canEditOrDelete && }` wrapper, since inner items are now individually wrapped.
            });

            // 3. Replace standard `canEditOrDelete && (` without fragments
            content = content.replace(/\{canEditOrDelete\s*&&\s*\(\s*(<([a-zA-Z0-9_.-]+)[^>]*>[\s\S]*?<\/\2>)\s*\)\s*\}/g, (match, buttonMatch) => {
                if (buttonMatch.toLowerCase().includes('delete') || buttonMatch.toLowerCase().includes('trash')) {
                    return `{canDelete && (${buttonMatch})}`;
                } else if (buttonMatch.toLowerCase().includes('edit') || buttonMatch.toLowerCase().includes('update')) {
                    return `{canEdit && (${buttonMatch})}`;
                }
                return match;
            });

            // 4. Other inline usages like `canEditOrDelete && ...`
            content = content.replace(/canEditOrDelete\s*&&/g, (match) => {
                return `canDelete &&`; // default inline standalone `canEditOrDelete &&` to `canDelete &&` (usually delete buttons, e.g. ActionMenus) unless we can see Edit context.
            });

            // Special cases where `canDelete &&` might not be correct if it's an Edit button. We will just leave it and see.

            if (originalContent !== content) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log('Fixed', filePath);
            }
        }
    }
});
