import * as readline from "readline/promises"
// Your application logic goes here


// Input Collection
//     The application should ask the user the following questions:
//         “How high is the check? (e.g., 50.00)”
//         “What percentage of tip will you give? (e.g., 15 for 15%)”
//         “Should the bill be split among multnpmiple people? (yes/no)”
//             If the answer is “yes”, then ask: “How many people will split the bill?”
// Class-Based Structure:
//     You must use at least one class (e.g., TipCalculator, Bill, UserInputHandler) to encapsulate the logic and data related to the tip calculation.
//     Think about how to organize the properties (like check amount, tip percentage, number of people) and methods (like calculate_tip, calculate_total calculate_per_person_cost) within your class(es).
// Calculations
//     The application should perform the following calculations and display the results:
//         Tip Amount: Calculate the total tip amount based on the check and percentage.
//         Total Bill: Calculate the total amount including the check and the tip.
//         Amount Per Person (if split): If the bill is split, calculate how much each person needs to pay.
// Output
//     Present the results clearly and formatted (e.g., currency symbols, two decimal places for monetary values).
//     Show the information of Split among people, Split between how many people and Each person pays only if Split among people is true
// Error Handling (Basic)
//     Implement basic error handling for user input (e.g., ensure numerical inputs are valid numbers, handle “yes/no” responses appropriately).
//     Inform the user if their input is invalid and prompt them again.
//
// Implement a custom decorator that can be applied to a method within your TipCalculator class (or similar).
// Refactor your application to use a simple form of dependency injection.
//     Instead of having a class directly create its dependencies (e.g., an InputReader class), pass them into the constructor.
//     Example: If you have a TipCalculator class that relies on an InputHandler class to get user input, instead of TipCalculator creating an InputHandler internally, pass an instance of InputHandler to the TipCalculator’s constructor. This makes your code more modular and testable.


class InputHandler {
    private rl: readline.Interface;

    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        })
    }

    public async getCheckAmount() {
        return this.rl.question("How high is the check? (e.g., 50.00)")
    }

    public async getPercentage() {
        return this.rl.question("What percentage of tip will you give? (e.g., 15 for 15%)")
    }

    public async getSplitInfo() {
        const answer = await this.rl.question("Should the bill be split among multiple people? (yes/no)")
        if (answer === "yes") {
            const splitBy = await this.rl.question("How many people will split the bill?")
            return {
                split: true,
                splitBy: Number(splitBy)
            }
        } else {
            return {
                split: false,
                splitBy: 0
            }
        }
    }
    public close() {
        this.rl.close()
    }
}

class TipCalculator {
    private checkAmount: number = 0;
    private tipPercentage: number = 0;
    private tipAmount: number = 0;
    private split: boolean = false;
    private splitBy: number = 0;

    constructor(
        private inputHandler: InputHandler,
    ) {
    }

    public async start() {
        this.checkAmount = Number(await this.inputHandler.getCheckAmount())
        this.tipPercentage = Number(await this.inputHandler.getPercentage())
        const { split, splitBy } = await this.inputHandler.getSplitInfo()
        this.split = split
        this.splitBy = splitBy
        this.tipAmount = this.calcTipAmount(this.checkAmount, this.tipPercentage)
        // console.log(this.checkAmount, this.tipPercentage, this.split, this.splitBy)
        this.output()
        this.inputHandler.close()
    }

    private output() {
        const message = `--- Tip Calculation Summary ---
Check Amount: \$${this.checkAmount}
Tip Percentage: ${this.tipPercentage.toFixed(2)}%
Tip Amount: \$${this.tipAmount.toFixed(2)}
Total Bill: \$${this.calcTotalBill(this.checkAmount, this.tipPercentage).toFixed(2)}
Divide among people: ${this.split ? "yes" : "no"}
Split between how many people: ${this.splitBy}
Each person pays: \$${this.calcPerPerson(this.checkAmount, this.splitBy, this.tipPercentage).toFixed(2)}
-----------------------------`
        console.log(message)
    }

    calcTipAmount(amount: number, percentage: number) {
        return amount * (percentage / 100)
    }

    calcTotalBill(amount: number, percentage: number) {
        const tip = this.calcTipAmount(amount, percentage)
        return tip + amount
    }

    calcPerPerson(amount: number, numberOfPersons: number, percentage: number) {
        const totalAmount = this.calcTotalBill(amount, percentage)
        return totalAmount / numberOfPersons
    }
}

const inputHandler = new InputHandler();
const calc = new TipCalculator(inputHandler);
await calc.start();