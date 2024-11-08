'use client'
import HeaderBox from '@/components/HeaderBox';
import AnimatedCounter from '@/components/AnimatedCounter';
import React, { useEffect, useState } from 'react';
import AccountBox from '@/components/AccountBox';
import { useAppSelector } from '@/store/hooks';
import { accountAction } from '@/lib/actions/accountAction';
import { useCronResolver } from '@/hooks/useCronResolver';

const Dashboard = () => {
    const user = useAppSelector(state => state.user);
    const user_id = (user.user_id)?.toString();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [username, setUsername] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeDashboard = async () => {
            if (user_id) {
                // Run cron jobs resolver first
                await useCronResolver();

                // Fetch accounts and set them
                accountAction.fetchAccountsbyUserId(user_id).then((data) => {
                    setAccounts(data);
                }).catch((error) => {
                    console.error('Error fetching accounts:', error);
                });

                // Fetch the username based on user_id
                accountAction.fetchUsernamebyUserId(user_id)
                    .then((fetchedUsername) => {
                        setUsername(fetchedUsername); // Set the fetched username
                    })
                    .catch((error) => {
                        console.error('Error fetching username:', error);
                        setUsername('');
                    })
                    .finally(() => {
                        setLoading(false); // Set loading false when all data is fetched
                    });
            }
        };

        initializeDashboard();
    }, [user_id]);

    const totalBalance = accounts.reduce((acc, account) => {
        if (account.type === 'credit') {
            return acc - (account.opening_balance - account.balance || 0);
        } else {
            return acc + (account.balance || 0);
        }
    }, 0);

    return (
        <section className="flex w-full flex-row max-xl:max-h-screen font-inter">
            <div className="flex w-full flex-1 flex-col gap-8 px-5 sm:px-8 py-6 lg:py-12 lg:px-20 xl:px-40 2xl:px-72 xl:max-h-screen">
                {loading ? (
                    <div className="flex items-center justify-center">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <>
                        <header className="home-header">
                            <HeaderBox
                                type="greeting"
                                title="Welcome"
                                user={username || ''}
                                subtext="View your account summaries"
                            />
                        </header>

                        <div className="border-t border-gray-200 my-1 sm:my-4"></div>

                        <div className="subheader mt-2 sm:mt-4 mb-4 sm:mb-6">
                            <h2 className="text-xl lg:text-4xl font-semibold text-blackText-50">Accounts:</h2>
                        </div>

                        {accounts.map((account) => (
                            <AccountBox key={account.id} account={account} />
                        ))}

                        <div className="border-t-2 border-blackText-100 my-2 sm:my-4"></div>

                        <div className="flex w-full justify-between items-center gap-4 p-4 sm:gap-6 sm:pt-6 pb-16">
                            <h2 className="text-24 lg:text-3xl font-semibold text-blackText-50">Total Balance</h2>
                            <div className="total-balance-amount text-right text-bold">
                                <AnimatedCounter amount={totalBalance} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};

export default Dashboard;
