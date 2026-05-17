import { createContext, useContext, useState, useCallback } from "react";
import {
  clients as initialClients,
  trainers as initialTrainers,
  expenses as initialExpenses,
  activities as initialActivities,
} from "../data";
import { getMembershipStatus } from "../utils";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [clients, setClients] = useState(
    initialClients.map((c) => ({ ...c, status: getMembershipStatus(c.expiryDate) }))
  );
  const [trainers, setTrainers] = useState(initialTrainers);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [activities, setActivities] = useState(initialActivities);

  // ── Clients ──────────────────────────────────────────────────────────────
  const addClient = useCallback((client) => {
    const newClient = {
      ...client,
      id: Date.now(),
      status: getMembershipStatus(client.expiryDate),
      payments: [],
    };
    setClients((prev) => [newClient, ...prev]);
  }, []);

  const updateClient = useCallback((id, updates) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, ...updates, status: getMembershipStatus(updates.expiryDate || c.expiryDate) }
          : c
      )
    );
  }, []);

  const deleteClient = useCallback((id) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // ── Trainers ─────────────────────────────────────────────────────────────
  const addTrainer = useCallback((trainer) => {
    setTrainers((prev) => [{ ...trainer, id: Date.now(), clients: 0 }, ...prev]);
  }, []);

  const updateTrainer = useCallback((id, updates) => {
    setTrainers((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const deleteTrainer = useCallback((id) => {
    setTrainers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Expenses ─────────────────────────────────────────────────────────────
  const addExpense = useCallback((expense) => {
    setExpenses((prev) => [{ ...expense, id: Date.now() }, ...prev]);
  }, []);

  const deleteExpense = useCallback((id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ── Activities ────────────────────────────────────────────────────────────
  const addActivity = useCallback((activity) => {
    setActivities((prev) => [{ ...activity, id: Date.now() }, ...prev]);
  }, []);

  const updateActivity = useCallback((id, updates) => {
    setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  }, []);

  const deleteActivity = useCallback((id) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // ── Computed stats ────────────────────────────────────────────────────────
  const stats = {
    totalClients: clients.length,
    activeClients: clients.filter((c) => c.status === "active").length,
    newClientsThisMonth: clients.filter((c) => {
      const joined = new Date(c.joinDate);
      const now = new Date();
      return joined.getMonth() === now.getMonth() && joined.getFullYear() === now.getFullYear();
    }).length,
    ptClients: clients.filter((c) => c.personalTraining).length,
    expiringClients: clients.filter((c) => c.status === "expiring"),
    expiredClients: clients.filter((c) => c.status === "expired"),
    monthlyRevenue: clients.reduce((acc, c) => {
      const lastPayment = c.payments[c.payments.length - 1];
      return acc + (lastPayment?.amount || 0);
    }, 0),
    monthlyExpenses: expenses
      .filter((e) => e.date.startsWith("2025-03"))
      .reduce((acc, e) => acc + e.amount, 0),
  };

  return (
    <AppContext.Provider
      value={{
        clients, addClient, updateClient, deleteClient,
        trainers, addTrainer, updateTrainer, deleteTrainer,
        expenses, addExpense, deleteExpense,
        activities, addActivity, updateActivity, deleteActivity,
        stats,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
