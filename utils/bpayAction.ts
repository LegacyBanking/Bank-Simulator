import { billAction } from "./billAction";
import { transactionAction } from "./transactionAction";
import { accountAction } from "./accountAction";
export const bpayAction = {
    payBills: async (user_id: string, from_account: Account, biller_name: string, biller_code: string, reference_number: string, amount: number, description: string): Promise<void> => {
        const bills = await billAction.fetchAssignedBills(user_id, biller_name);
        let billcredit = amount;
        for (const bill of bills) {
            if (billcredit <= 0) break;

            if (billcredit >= bill.amount!) {
                // Full payment
                await transactionAction.createBPAYTransaction(from_account, biller_name, biller_code, reference_number, bill.amount!, description, null);
                await billAction.updateBillStatus(bill, 'paid');
                billcredit -= bill.amount!;
            } else {
                // Partial payment
                await transactionAction.createBPAYTransaction(from_account, biller_name, biller_code, reference_number, billcredit, description, null);
                const newAmount = bill.amount! - billcredit;
                await billAction.updateBillStatus(bill, 'partial');
                await billAction.updateBillAmount(bill, newAmount);
                billcredit = 0;
            }
        }
        if (billcredit > 0) {
            const account = await accountAction.fetchAccountById(from_account.id);
            const newAmount = billcredit+account.balance;
            await transactionAction.updateAccounts(from_account,newAmount);

        }
    },

}