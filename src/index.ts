import { unwatchFile } from 'fs'
import * as readline from 'readline/promises'

function numberValidator(userInput: string, min: number, max: number) {
    const number = parseFloat(userInput)

    let isValid = !Number.isNaN(number) && userInput === String(number)
    if (!isValid) {
        console.log(`Wrong number value "${userInput}"`)
    }
    if (isValid && number < 0) {
        console.log(`number value "${number}" can't be lower than zero`)
        isValid = false
    }
    if (isValid && min !== undefined && number < min) {
        console.log(`number value "${number}" can't be lower than ${min}`)
        isValid = false
    }
    if (isValid && max !== undefined && number > max) {
        console.log(`number value "${number}" can't be greater than ${max}`)
        isValid = false
    }

    return isValid
}

function yesNoValidator(userInput: string) {
    const validAnswers = ['yes', 'no']
    const isValid = validAnswers.includes(userInput.trim())

    if (!isValid) {
        console.log(`Wrong input "${userInput}". Please type yes or no.`)
    }

    return isValid
}

function repeatUserInputUntilValid(validator: (...validatorParams: any[]) => boolean, ...validatorParams: any[]) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value // Store the original function

        descriptor.value = async function (...args: any[]) {
            let result = undefined
            let isValid = false
            do {
                result = await originalMethod.apply(this, args) // Execute the original function
                // validate a result
                isValid = validator(result, ...validatorParams)
            } while (!isValid)
            return result
        }

        return descriptor // Return the modified method
    }
}

class InputHandler {
    private rl: readline.Interface

    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })
    }

    @repeatUserInputUntilValid(numberValidator, 0, 100000)
    public async getCheckAmount() {
        return this.rl.question('How high is the check? (e.g., 50.00)')
    }

    @repeatUserInputUntilValid(numberValidator, 0, 100)
    public async getPercentage() {
        return this.rl.question('What percentage of tip will you give? (e.g., 15 for 15%)')
    }

    @repeatUserInputUntilValid(yesNoValidator)
    public async getSplitBoolean() {
        return await this.rl.question('Should the bill be split among multiple people? (yes/no)')
    }

    @repeatUserInputUntilValid(numberValidator, 0, 100)
    public async getSplitNumber() {
        return await this.rl.question('How many people will split the bill?')
    }

    public async getSplitInfo() {
        const answer = await this.getSplitBoolean()
        if (answer === 'yes') {
            const splitBy = await this.getSplitNumber()
            return {
                split: true,
                splitBy: Number(splitBy)
            }
        } else {
            return {
                split: false,
                splitBy: 1
            }
        }
    }
    public close() {
        this.rl.close()
    }
}

class TipCalculator {
    private checkAmount: number = 0
    private tipPercentage: number = 0
    private tipAmount: number = 0
    private split: boolean = false
    private splitBy: number = 0

    constructor(private inputHandler: InputHandler) {}

    public async start() {
        this.checkAmount = Number(await this.inputHandler.getCheckAmount())
        this.tipPercentage = Number(await this.inputHandler.getPercentage())
        const { split, splitBy } = await this.inputHandler.getSplitInfo()
        this.split = split
        this.splitBy = splitBy
        this.tipAmount = this.calcTipAmount()
        // console.log(this.checkAmount, this.tipPercentage, this.split, this.splitBy)
        this.output()
        this.inputHandler.close()
    }

    private output() {
        const message = `--- Tip Calculation Summary ---
Check Amount: \$${this.checkAmount}
Tip Percentage: ${this.tipPercentage.toFixed(2)}%
Tip Amount: \$${this.tipAmount.toFixed(2)}
Total Bill: \$${this.calcTotalBill().toFixed(2)}
Divide among people: ${this.split ? 'yes' : 'no'}
Split between how many people: ${this.splitBy}
Each person pays: \$${this.calcPerPerson().toFixed(2)}
-----------------------------`
        console.log(message)
    }

    calcTipAmount() {
        return this.checkAmount * (this.tipPercentage / 100)
    }

    calcTotalBill() {
        const tip = this.calcTipAmount()
        return tip + this.checkAmount
    }

    calcPerPerson() {
        const totalAmount = this.calcTotalBill()
        return totalAmount / this.splitBy
    }
}

const inputHandler = new InputHandler()
const calc = new TipCalculator(inputHandler)
await calc.start()
