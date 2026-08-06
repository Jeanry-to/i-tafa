"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      // Récupération des membres depuis Supabase
      const { data, error } = await supabase.from("users").select("*");
      if (!error && data) setUsers(data);
      setLoading(false);
    }
    fetchUsers();
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <header style={{ marginBottom: "30px", borderBottom: "2px solid #e0e0e0", paddingBottom: "10px" }}>
          <h1 style={{ color: "#1a1a1a", margin: 0 }}>Panneau d'administration i-Tafa</h1>
          <p style={{ color: "#666" }}>Espace de gestion réservé</p>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
          <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#888", fontSize: "14px" }}>Total Membres</h3>
            <span style={{ fontSize: "28px", fontWeight: "bold" }}>{users.length}</span>
          </div>
          <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#888", fontSize: "14px" }}>Paiements Actifs</h3>
            <span style={{ fontSize: "28px", fontWeight: "bold", color: "#2e7d32" }}>0</span>
          </div>
          <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#888", fontSize: "14px" }}>Statut Serveur</h3>
            <span style={{ fontSize: "16px", fontWeight: "bold", color: "#1565c0" }}>En ligne</span>
          </div>
        </section>

        <section style={{ background: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
          <h2 style={{ marginTop: 0, fontSize: "20px" }}>Liste des membres</h2>
          {loading ? (
            <p>Chargement des données...</p>
          ) : users.length === 0 ? (
            <p style={{ color: "#888" }}>Aucun utilisateur enregistré dans la base Supabase pour le moment.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #ddd" }}>
                  <th style={{ padding: "10px" }}>ID</th>
                  <th style={{ padding: "10px" }}>Email</th>
                  <th style={{ padding: "10px" }}>Date d'inscription</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "10px" }}>{u.id}</td>
                    <td style={{ padding: "10px" }}>{u.email}</td>
                    <td style={{ padding: "10px" }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}