#!/bin/zsh
cd "${0:A:h}"
if [[ -x "$HOME/.nvm/versions/node/v23.3.0/bin/node" ]]; then
  export PATH="$HOME/.nvm/versions/node/v23.3.0/bin:$PATH"
fi
if [[ ! -d node_modules ]]; then
  npm ci || exit 1
fi
print 'Chess Review will open at http://localhost:5173'
npm run dev
