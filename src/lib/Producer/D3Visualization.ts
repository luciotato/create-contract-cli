import { ASTBase } from "../Parser/ASTBase";
import { writeFileSync } from "fs";

type treeNodeData = {
    id?: number;
    text?: string;
    children?: treeNodeData[];
}

// @ts-ignore
ASTBase.prototype.getTreeData = function () {
    const childrenData = []
    global["level"] = global["level"] + 1
    if (global["level"] < 3) {
        for (const child of this.children) {
            childrenData.push(child.getTreeData())
        }
    }
    global["level"] = global["level"] - 1
    global["treeNodeID"] = global["treeNodeID"] +1
    return {
        id: global["treeNodeID"],
        text: this.toString(),
        children: childrenData
    }
}

export class D3Visualization {

    static saveForTree(root: ASTBase, outFilename: string) {

        global["treeNodeID"] = 1
        global["level"] = 0

        // @ts-ignore
        const data = root.getTreeData()

        writeFileSync(outFilename, JSON.stringify(data))

        console.log(process.cwd())

    }
}
