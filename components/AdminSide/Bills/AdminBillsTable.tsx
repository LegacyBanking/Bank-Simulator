import React, { useEffect, useState } from 'react';
import { billAction } from '@/lib/actions/billAction';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatAmount } from "@/lib/utils";
import { ChevronUp, ChevronDown, ChevronsUpDown, Trash2Icon, UserPlus, UserMinus } from 'lucide-react';
import TrashBillDetailSheet from './TrashBillDetialSheet';
import AssignUserSheet from './AssignUserSheet';
import UnassignUserSheet from './UnassignUserSheet';
import AdminBillDetailSheet from './AdminBillSheet';
import SavedStatus from '../Presets/SavedStatus';

const AdminBillsTable = () => {
  const [bills, setBills] = useState<AdminBillWithBiller[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof AdminBill; direction: 'ascending' | 'descending' } | null>(null);
  const [deleteBillId, setDeleteBillId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isAssignSheetOpen, setIsAssignSheetOpen] = useState(false);
  const [isUnassignSheetOpen, setIsUnassignSheetOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<AdminBillWithBiller | null>(null);
  const [isAdminBillSheetOpen, setIsAdminBillSheetOpen] = useState(false);

  // Function to open the admin bill details popup
  const openBillDetails = (bill: AdminBillWithBiller) => {
    if (!isAssignSheetOpen && !isUnassignSheetOpen && !showDeleteDialog) {
      setSelectedBill(bill);
      setIsAdminBillSheetOpen(true);
    }
  };

  // Function to close the admin bill details popup
  const closeBillDetails = () => {
    setIsAdminBillSheetOpen(false);
    setSelectedBill(null);

  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await billAction.fetchAdminBills();
        setBills(data);
      } catch (error) {
        console.error('Failed to fetch bills:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const updateBillPresetStatus = (billId: string, newStatus: boolean) => {
    setBills((prevBills) =>
        prevBills.map((bill) =>
            bill.id === billId ? { ...bill, preset_status: newStatus } : bill
        )
    );
};

  // Function to fetch updated assigned users for a specific bill
  const fetchUpdatedAssignedUsers = async (billId: string) => {
    try {
      const updatedBill = await billAction.fetchAdminBillById(billId);
      setBills((prevBills) =>
        prevBills.map((bill) =>
          bill.id === billId ? { ...bill, assigned_users: updatedBill.assigned_users } : bill
        )
      );
    } catch (error) {
      console.error("Error fetching updated assigned users:", error);
    }
  };

  // Delete the bill and remove it from the state
  const handleDelete = async () => {
    if (deleteBillId) {
      try {
        //   await billAction.deleteAdminBill(deleteBillId); // Call the delete function
        await billAction.deleteAdminBillWithReferences(deleteBillId);

        setBills((prevBills) => prevBills.filter((bill) => bill.id !== deleteBillId));
        setShowDeleteDialog(false); // Close the dialog after deleting
      } catch (error) {
        console.error('Failed to delete bill:', error);
      }
    }
  };

  const handleSort = (key: keyof AdminBill) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedBills = React.useMemo(() => {
    if (sortConfig && sortConfig.key) {
      return [...bills].sort((a, b) => {
        const aValue = a[sortConfig.key as keyof AdminBill];
        const bValue = b[sortConfig.key as keyof AdminBill];

        // Handle undefined values safely
        if (aValue === undefined || bValue === undefined) {
          return 0;  // If either value is undefined, consider them equal
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return bills;
  }, [bills, sortConfig]);

  // const sortedBills = React.useMemo(() => {
  //   if (sortConfig !== null) {
  //     return [...bills].sort((a, b) => {
  //       if (a[sortConfig.key] < b[sortConfig.key]) {
  //         return sortConfig.direction === 'ascending' ? -1 : 1;
  //       }
  //       if (a[sortConfig.key] > b[sortConfig.key]) {
  //         return sortConfig.direction === 'ascending' ? 1 : -1;
  //       }
  //       return 0;
  //     });
  //   }
  //   return bills;
  // }, [bills, sortConfig]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const getSortIcon = (key: keyof AdminBill) => {
    if (sortConfig?.key === key) {
      return sortConfig.direction === 'ascending' ? (
        <ChevronUp className="inline h-4 w-4" strokeWidth={3} />
      ) : (
        <ChevronDown className="inline h-4 w-4" strokeWidth={3} />
      );
    }
    return <ChevronsUpDown className="inline h-4 w-4" strokeWidth={3} />; // Default icon
  };

  const columns = [
    { label: 'Biller', key: 'biller' as keyof AdminBill },
    { label: 'Amount', key: 'amount' as keyof AdminBill },
    { label: 'Due Date', key: 'due_date' as keyof AdminBill },
    { label: 'Action', key: null }, // actions won't be sorted
  ];

  const handleAssignUserClick = (bill: AdminBillWithBiller) => {
    closeBillDetails();
    setSelectedBill(bill); // Set the bill details for assignment
    setIsAssignSheetOpen(true); // Open the AssignUserSheet
  };

  const handleUnassignUserClick = (bill: AdminBillWithBiller) => {
    closeBillDetails();
    setSelectedBill(bill); // Set the bill details for unassignment
    setIsUnassignSheetOpen(true); // Open the UnassignUserSheet
  };

  const handleDeleteClick = (bill: AdminBillWithBiller) => {
    closeBillDetails(); // Close the bill details sheet when opening the delete confirmation
    setDeleteBillId(bill.id); // Set the bill ID to delete
    setShowDeleteDialog(true); // Show the confirmation dialog
  };

  // This function will be passed to AssignUserSheet to update the assigned users after assignment
  const handleAssignComplete = async (billId: string) => {
    await fetchUpdatedAssignedUsers(billId);
    const updatedBill = await billAction.fetchAdminBillById(billId); // Re-fetch the entire bill including assigned users
    setSelectedBill(updatedBill); // Update the selectedBill with the newly fetched assigned users
    setIsAssignSheetOpen(false); // Close the assign sheet
    setIsAdminBillSheetOpen(true); // Reopen the Admin Bill Sheet
  };

  const handleUnassignComplete = async (billId: string) => {
    await fetchUpdatedAssignedUsers(billId);
    const updatedBill = await billAction.fetchAdminBillById(billId); // Re-fetch the entire bill including assigned users
    setSelectedBill(updatedBill); // Update the selectedBill with the newly fetched assigned users
    setIsUnassignSheetOpen(false); // Close the unassign sheet
    setIsAdminBillSheetOpen(true); // Reopen the Admin Bill Sheet
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="bg-blue-200 text-white-200">
            <TableHead
              className="font-inter px-8 rounded-tl-2xl font-normal tracking-wider cursor-pointer"
              onClick={() => handleSort('biller')}
            >
              Biller
              <span className="ml-2">{getSortIcon('biller')}</span>
            </TableHead>
            <TableHead
              className="font-inter px-4 font-normal tracking-wider cursor-pointer"
              onClick={() => handleSort('amount')}
            >
              Amount
              <span className="ml-2">{getSortIcon('amount')}</span>
            </TableHead>
            <TableHead
              className="font-inter px-2 font-normal tracking-wider cursor-pointer"
              onClick={() => handleSort('due_date')}
            >
              Due Date
              <span className="ml-2">{getSortIcon('due_date')}</span>
            </TableHead>
            <TableHead className="font-inter px-2 font-normal tracking-wider cursor-pointer"
              onClick={() => handleSort('preset_status')}>    
              Preset
              <span className="ml-2">{getSortIcon('preset_status')}</span>
            </TableHead>
            <TableHead className="font-inter px-8 rounded-tr-2xl font-normal tracking-wider">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {sortedBills.map((bill: AdminBillWithBiller) => {
            const billerName = bill.biller.name;
            const amount = bill.amount;
            const dueDate = new Date(bill.due_date);

            return (
              <TableRow key={bill.id} className="border-b cursor-pointer"
                // Admin Bill Sheet on click
                onClick={() => openBillDetails(bill)}
              >
                <TableCell className="max-w-[200px] pl-8 pr-10">
                  <div className="flex items-center gap-3">
                    <h1 className="font-inter text-sm truncate font-semibold text-[#344054]">
                      {billerName}
                    </h1>
                  </div>
                </TableCell>

                <TableCell className="font-inter font-semibold">
                  {formatAmount(amount)}
                </TableCell>

                <TableCell className="font-inter min-w-32 pl-2 pr-10 text-[#475467]">
                  {dueDate.toDateString()}
                </TableCell>

                <TableCell className="font-inter text-base min-w-32 pl-2 pr-10">
                  <SavedStatus status={bill.preset_status} />
                </TableCell>

                <TableCell>
                  <div className="flex flex-col lg:flex-row justify-start gap-6 px-4">
                    <Button className="bg-white-100 border border-gray-300 p-2"
                      // onClick={() => handleAssignUserClick(bill)}
                      onClick={(e) => { e.stopPropagation(); handleAssignUserClick(bill); }}
                    >
                      <UserPlus className="inline h-6 w-6" fill="#99e087" />
                    </Button>
                    <Button className="bg-white-100 border border-gray-300 p-2"
                      // onClick={() => handleUnassignUserClick(bill)}
                      onClick={(e) => { e.stopPropagation(); handleUnassignUserClick(bill); }}
                    >
                      <UserMinus className="inline h-6 w-6" fill="#F87171" />
                    </Button>
                    <Button
                      className="bg-white-100 border border-gray-300 p-2"
                      // onClick={() => {
                      //   setDeleteBillId(bill.id); // Set the bill ID to delete
                      //   setShowDeleteDialog(true); // Show the confirmation dialog
                      // }}
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(bill); }}
                    >
                      <Trash2Icon className="inline h-6 w-6" fill="#F87171" stroke="black" strokeWidth={1} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>

      </Table>

      {isAdminBillSheetOpen && selectedBill && (
        <AdminBillDetailSheet
          bill={selectedBill}
          onClose={closeBillDetails}
          onPresetStatusChange={updateBillPresetStatus}
        />
      )}

      {/* Add Assign Bill Sheet */}
      {selectedBill && (
        <>
          {console.log("AssignUserSheet Props: ", {
            biller: selectedBill.biller,
            amount: selectedBill.amount,
            description: selectedBill.description || "",
            duedate: selectedBill.due_date
          })}
          <AssignUserSheet
            isOpen={isAssignSheetOpen}
            onClose={() => setIsAssignSheetOpen(false)}
            biller={selectedBill.biller} // Pass full biller object with name and biller_code
            amount={selectedBill.amount}
            description={selectedBill.description || ""}
            due_date={new Date(selectedBill.due_date)}
            linkedBill={selectedBill.id}
            assignedUsers={selectedBill.assigned_users || ""}
            onAssignComplete={handleAssignComplete}
          />
        </>
      )}


      {/* Add Unassign Bill Sheet */}
      {selectedBill && (
        <>
          <UnassignUserSheet
            isOpen={isUnassignSheetOpen}
            onClose={() => setIsUnassignSheetOpen(false)}
            biller={selectedBill.biller}
            amount={selectedBill.amount}
            description={selectedBill.description || ""}
            due_date={new Date(selectedBill.due_date)}
            linkedBill={selectedBill.id}
            assignedUsers={selectedBill.assigned_users || ""}
            onUnassignComplete={handleUnassignComplete}
          />
        </>
      )}


      {/* Delete Confirmation Dialog */}
      <TrashBillDetailSheet
        status={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        deleteBill={handleDelete}
      />

    </>
  );
};

export default AdminBillsTable;
