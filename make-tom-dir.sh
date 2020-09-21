#tsc --build
DEST=tom
mkdir -p $DEST
cp model/package.json $DEST
mkdir -p $DEST/bin
cp model/cli $DEST/bin/
cp dist/tom.js $DEST/cli.js
chmod +x $DEST/cli.js
cp dist/ContractAPI.js $DEST
mkdir -p $DEST/util
cp dist/util/*.js $DEST/util


