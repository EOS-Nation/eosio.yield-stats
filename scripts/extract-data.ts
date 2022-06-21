import * as jsonl from "node-jsonl";
import * as fs from "fs";
import * as path from "path";
import * as glob from "glob";
import { writer } from "repl";

const filepaths = glob.sync(path.join(__dirname, "..", "data", "*.jsonl"));

export interface Updatelog {
    balances: string[];
    category: string;
    contracts: string[];
    evm: any[];
    oracle: string;
    period: Date;
    prices: string[];
    protocol: string;
    tvl: string;
    usd: string;
}

export interface Event<T> {
    block_num: number;
    timestamp: number;
    transactionId: string;
    name: string;
    account: string;
    json: T;
}

(async () => {
    for ( const filepath of filepaths ) {
        const filename = path.parse(filepath).name;
        const writers = {
            updatelog: fs.createWriteStream( path.join(__dirname, "..", 'data', `${filename}_updatelog.csv`)),
            report: fs.createWriteStream( path.join(__dirname, "..", 'data', `${filename}_report.csv`)),
            rewardslog: fs.createWriteStream( path.join(__dirname, "..", 'data', `${filename}_rewardslog.csv`)),
        }

        // headers
        writers.updatelog.write(["block_num","timestamp","transactionId", "protocol","tvl","usd","period", "balances","prices"].join(",") + "\n");
        writers.report.write(["block_num","timestamp","transactionId", "protocol","tvl","usd","period"].join(",") + "\n");
        writers.rewardslog.write(["block_num","timestamp","transactionId", "protocol","tvl","usd","period", "rewards"].join(",") + "\n");

        const rl = jsonl.readlines<Event<any>>(filepath)
        while (true) {
            const {value, done} = await rl.next()
            if (done) break;
            // console.log(value); // value => T
            const { block_num, timestamp, transactionId, name } = value;
            const { protocol, tvl, usd, period, balances, prices, rewards } = value.json;

            if ( name == "updatelog") writers.updatelog.write([ block_num, timestamp, transactionId, protocol, tvl, usd, period, balances.join("|"), prices.join("|")].join(",") + "\n");
            if ( name == "report") writers.report.write([ block_num, timestamp, transactionId, protocol, tvl, usd, period].join(",") + "\n");
            if ( name == "rewardslog") writers.rewardslog.write([ block_num, timestamp, transactionId, protocol, tvl, usd, period, rewards].join(",") + "\n");
        }
    }
})()
