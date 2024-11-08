"use client";

import React, { useState, useEffect, Suspense } from 'react';
import HeaderBox from '@/components/HeaderBox';
import { TransactionsTable } from '@/components/TransactionsTable';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/shadcn_ui/select';
import { Button } from '@/components/shadcn_ui/button';
import { accountAction } from '@/lib/actions/accountAction';
import { transactionAction } from '@/lib/actions/transactionAction';
import { useSearchParams, useRouter } from 'next/navigation';
import AccountBox from '@/components/AccountBox';
import { Pagination } from '@/components/Pagination';
import { useAppSelector } from '@/store/hooks';
import { capitalizeFirstLetter, formatAmount } from '@/lib/utils/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { startOfMonth, format } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import MonthPicker from '@/components/MonthPicker';
import { Tooltip } from 'react-tooltip';

import { cn } from "@/lib/utils/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn_ui/popover"
import "react-day-picker/dist/style.css";

const TransactionHistoryContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const accountId = searchParams.get('accountid');
  const pageFromUrl = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
  const user_id = useAppSelector((state) => state.user.user_id)?.toString();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [account, setAccount] = useState<Account>({} as Account);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(pageFromUrl);
  const [loading, setLoading] = useState(true);
  const rowsPerPage = 10;

  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(undefined);

  // Inside the main component
  useEffect(() => {
    if (user_id) {
      setLoading(true);

      // Fetch accounts
      accountAction.fetchAccountsbyUserId(user_id).then((data) => {
        setAccounts(data);
      }).catch((error) => {
        console.error('Error fetching accounts:', error);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [user_id]);


  // Fetch account and transactions when accountId or page changes
  useEffect(() => {
    if (accountId) {
      accountAction.fetchAccountById(accountId)
        .then((data) => {
          setAccount(data);
        })
        .catch((error) => {
          console.error('Error fetching account:', error);
          return;
        });

      // Fetch transactions for the account
      transactionAction.getTransactionsByAccountId(accountId)
        .then((data) => {
          // Fetch the username and combine it with dummy data
          accountAction.fetchUsernamebyUserId(user_id)
            .then((fetchedUsername) => {
              var updatedDummyData: Transaction[] = [];

              accountAction.fetchAccountTypebyId(accountId)
                .then((fetchedType) => {
                  var combinedData = data;

                  if (fetchedType == 'personal') {



                  } else if (fetchedType == 'credit') {
                    // updatedDummyData = [
                    //   {
                    //     id: "3",
                    //     description: "| Biller: Gas Service, Code: 1234, Ref: 567834512452",
                    //     amount: -45.51,
                    //     paid_on: new Date("2024-09-15T10:00:00.000Z"),
                    //     from_account: user_id,
                    //     from_account_username: fetchedUsername,
                    //     to_account: "",
                    //     to_biller: "100",
                    //     to_account_username: "Gas Service",
                    //     transaction_type: 'bpay',
                    //   },
                    //   {
                    //     id: "4",
                    //     description: "Funds Transfer to Savings",
                    //     amount: -100.0,
                    //     paid_on: new Date("2024-09-15T12:30:00.000Z"),
                    //     from_account: user_id,
                    //     from_account_username: fetchedUsername,
                    //     to_account: "100",
                    //     to_biller: "",
                    //     to_account_username: "Jon Doe",
                    //     transaction_type: 'pay anyone',
                    //   },
                    //   {
                    //     id: "5",
                    //     description: "| Biller: Internet Service, Code: 8765, Ref: 432132861542",
                    //     amount: -79.99,
                    //     paid_on: new Date("2024-09-14T08:45:00.000Z"),
                    //     from_account: user_id,
                    //     from_account_username: fetchedUsername,
                    //     to_account: "",
                    //     to_biller: "101",
                    //     to_account_username: "Internet Service",
                    //     transaction_type: 'bpay',
                    //   },
                    // ];

                  }
                  combinedData = combinedData.concat(updatedDummyData);
                  // Filter transactions by the selected month
                  if (selectedMonth) {
                    combinedData = combinedData.filter((transaction) => {
                      const transactionDate = new Date(transaction.paid_on);
                      return (
                        transactionDate.getMonth() === selectedMonth.getMonth() &&
                        transactionDate.getFullYear() === selectedMonth.getFullYear()
                      );
                    });
                  }
                  setTransactions(combinedData);
                  setLoading(false); // Set loading to false after fetching data

                  // Combine fetched transactions with dummy data

                  combinedData = combinedData.concat(updatedDummyData);
                  // Filter transactions by the selected month
                  if (selectedMonth) {
                    combinedData = combinedData.filter((transaction) => {
                      const transactionDate = new Date(transaction.paid_on);
                      return (
                        transactionDate.getMonth() === selectedMonth.getMonth() &&
                        transactionDate.getFullYear() === selectedMonth.getFullYear()
                      );
                    });
                  }
                  setTransactions(combinedData);
                  setLoading(false); // Set loading to false after fetching data

                });
            });
        })

        .catch((error) => {
          console.error('Error fetching username:', error);
          setLoading(false);
        });

      setPage(pageFromUrl);
    }
  }, [accountId, pageFromUrl, user_id, selectedMonth]);

  const handleAccountChange = (value: string) => {

    const currentPage = pageFromUrl;
    // Reset the page to 1 when account is changed or even when selecting the same account
    if (String(value) === String(accountId) && currentPage === 1) {
      // If the account is the same and already on page 1, do nothing
      return;
    }

    setLoading(true);
    router.push(`/transaction-history?accountid=${value}&page=1`);

  };

  const handleDownloadStatement = () => {
    const doc = new jsPDF();
    doc.text('Transaction History', 14, 20);
    doc.setFontSize(12);
    const accountType = capitalizeFirstLetter(account.type);

    // Conditional labels based on account type
    const isCreditAccount = accountType === 'Credit';
    const openingBalanceLabel = isCreditAccount ? 'Credit Limit' : 'Opening Balance';
    const currentBalanceLabel = isCreditAccount ? 'Credit Used' : 'Current Balance';

    const openingBalance = formatAmount(account.opening_balance);
    const currentBalance = isCreditAccount
      ? formatAmount(account.opening_balance - account.balance) // Credit used is opening balance - current balance
      : formatAmount(account.balance);

    doc.text(`Account: ${accountType} Account`, 14, 30);
    doc.text(`${openingBalanceLabel}: ${openingBalance}`, 14, 40);
    doc.text(`${currentBalanceLabel}: ${currentBalance}`, 14, 50);

    // Display selected month if one is chosen
    if (selectedMonth) {
      const formattedMonth = format(selectedMonth, "LLLL yyyy");
      doc.text(`Statement for: ${formattedMonth}`, 14, 60);
    } else {
      doc.text(`Statement for: All time`, 14, 60); // Fallback if no month is selected
    }

    doc.setFontSize(10);
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-GB');
    const formattedTime = currentDate.toLocaleTimeString();
    const pageWidth = 210;
    const marginRight = 14;
    const textWidth = doc.getTextWidth(`Downloaded on: ${formattedDate} at ${formattedTime}`);
    const xPosition = pageWidth - textWidth - marginRight;

    doc.text(`Downloaded on: ${formattedDate} at ${formattedTime}`, xPosition, 65);

    const tableColumn = ['Transaction', 'Date', 'Amount'];
    const tableRows: any[] = [];
    transactions.forEach((transaction) => {
      const transactionData = [
        transaction.amount > 0
          ? transaction.from_account_username : transaction.to_account_username,
        new Date(transaction.paid_on).toLocaleDateString('en-GB'),
        `${transaction.amount > 0 ? `+$${transaction.amount.toFixed(2)}` : `-$${Math.abs(transaction.amount).toFixed(2)}`}`,
      ];
      tableRows.push(transactionData);
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 70,
    });

    doc.save('transaction_history.pdf');
  };

  const totalPages = Math.ceil(transactions.length / rowsPerPage);
  const indexOfLastTransaction = page * rowsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - rowsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstTransaction, indexOfLastTransaction);

  return (
    <section className="flex w-full flex-col max-xl:max-h-screen font-inter">
      <div className="flex w-full flex-1 flex-col gap-8 px-5 sm:px-8 py-6 lg:py-12 lg:px-20 xl:px-40 2xl:px-72 xl:max-h-screen">
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            <header className="home-header">
              <HeaderBox
                type="title"
                title="Transaction History"
                subtext="View and or Download all of your recent transactions"
              />
            </header>
            <div className="flex justify-end">
              <Select onValueChange={handleAccountChange} value={accountId ?? accounts[0]?.id}>
                <SelectTrigger className="w-52 bg-white-100 hover:bg-gray-100">
                  <span className="text-base mx-auto text-center">{`${capitalizeFirstLetter(String(account.type))} Account`}</span>
                </SelectTrigger>
                <SelectContent className="bg-white-100">
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id} className='hover:bg-gray-100'>
                      {`${capitalizeFirstLetter(String(acc.type))} Account`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <AccountBox account={account} />

            <div className="flex justify-between items-center flex-wrap">
              <h2 className="py-2 text-xl font-semibold text-gray-900">
                Recent Transactions
              </h2>
              <div className="flex flex-row gap-5 items-center flex-wrap">
                <div className="grid gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                          "w-[220px] text-base justify-start text-left font-normal bg-white-100 border border-gray-300 hover:bg-gray-100 font-inter",
                          !selectedMonth && "text-gray-500"
                        )}
                      >
                        <div className="flex items-center">
                          <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                          {selectedMonth ? format(selectedMonth, "LLLL yyyy") : <span>Select Month</span>}
                        </div>
                        {selectedMonth && (
                          <div className="ml-auto mt-1">
                            <button
                              onClick={() => setSelectedMonth(undefined)}
                              className="text-gray-500 hover:text-black focus:outline-none"
                              aria-label="Clear month filter"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white-100 border border-gray-200 shadow-lg">
                      <MonthPicker
                        currentMonth={selectedMonth || new Date()}
                        onMonthChange={setSelectedMonth}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Separate Tooltip ID usage for the Download Statement button */}
                <Button
                  onClick={handleDownloadStatement}
                  className="ml-auto border font-normal border-gray-300 px-8 text-base bg-white-100 hover:bg-gray-200 text-black"
                  data-tooltip-id="download-tooltip"
                >
                  Download Statement
                </Button>

                <Tooltip id="download-tooltip" place="top" className="max-w-sm text-sm bg-gray-800 text-white p-2 rounded shadow-lg z-50">
                  <p>Try this if you want to keep track of your transactions in a given time! Real banks usually keep track of up to two years of records.</p>
                </Tooltip>
              </div>



              {/* Add Tooltip to the Download Statement button */}
              <Tooltip content="Try this if you want to keep track of your transactions in a given time! Real banks usually keep track of up to two years of records.">
                <Button
                  onClick={handleDownloadStatement}
                  className="ml-auto border font-normal border-gray-300 px-8 text-base bg-white-100 hover:bg-gray-200 text-black"
                >
                  Download Statement
                </Button>
              </Tooltip>


            </div>



            <section className="flex w-full flex-col gap-6">
              <TransactionsTable transactions={currentTransactions} />
              {totalPages > 1 && (
                <div className="my-4 w-full pb-2">
                  <Pagination totalPages={totalPages} page={page} setPage={setPage} />
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </section >
  );
};

// Wrap in Suspense on export
const TransactionHistory = () => (
  <Suspense fallback={<div>Loading transaction history...</div>}>
    <TransactionHistoryContent />
  </Suspense>
);

export default TransactionHistory;
