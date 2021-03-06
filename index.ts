import { streamBlocks } from "./src/dfuse";
import { Block } from "./src/firehose"
import fs from "fs";

// Data Params
const HOUR = 7200;
const stop_block_num = 253213094;
const start_block_num = stop_block_num - HOUR * 48;
const contracts = ["d.o.yield", "d.e.yield"];
const include_filter_expr = contracts.map(contract => `receiver == "${contract}"`).join(" || ");
const exclude_filter_expr = ''

// JSON Line writer
if ( !fs.existsSync("data") ) fs.mkdirSync("data");
const writer = fs.createWriteStream(`./data/${contracts.join("-")}_${start_block_num}-${stop_block_num}.jsonl`);

function callback(block: Block) {
    const block_num = block.number;
    const timestamp = Number(block.header.timestamp.seconds);

    // log
    const actions = block.filteredExecutedTotalActionCount;
    const transactions = block.filteredTransactionCount;
    if ( actions ) console.log({ block_num, actions, transactions });

    // save JSON line
    for ( const { actionTraces } of block.filteredTransactionTraces ) {
        for ( const { action, transactionId, receiver } of actionTraces ) {
            const { name, account } = action;
            if ( account != receiver ) continue;
            if ( !new Set(contracts).has( receiver )) continue;
            const json = JSON.parse(action.jsonData);
            const row = {block_num, timestamp, transactionId, name, account, json};
            writer.write(JSON.stringify(row) + "\n");
        }
    }
}

(async () => {
    await streamBlocks(start_block_num, stop_block_num, callback, {include_filter_expr, exclude_filter_expr});
    console.log("done");
})();