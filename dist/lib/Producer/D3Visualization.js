import { ASTBase } from "../Parser/ASTBase.js"
import { writeFileSync } from "fs"
// @ts-ignore
ASTBase.prototype.getTreeData = function () {
    const childrenData = []
    global.level = global.level + 1
    if (global.level < 3) {
        for (const child of this.children) {
            childrenData.push(child.getTreeData())
        }
    }
    global.level = global.level - 1
    global.treeNodeID = global.treeNodeID + 1
    return {
        id: global.treeNodeID,
        text: this.toString(),
        children: childrenData
    }
}
export class D3Visualization {
    static saveForTree (root, outFilename) {
        global.treeNodeID = 1
        global.level = 0
        // @ts-ignore
        const data = root.getTreeData()
        writeFileSync(outFilename, JSON.stringify(data))
        console.log(process.cwd())
    }
}
// # sourceMappingURL=D3Visualization.js.map
