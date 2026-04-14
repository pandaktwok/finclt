import { useState, useMemo, useCallback, useEffect } from "react";

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// Neo-brutalist palette (high chroma pastels)
const PALETTE = [
  "#fad286", "#b1efd8", "#d1b3ff", "#f95630", "#ffb2b9", "#ae8dff",
  "#48e4ff", "#ff86c3", "#a8c5da", "#f4a261", "#e9c46a", "#2ec4b6",
  "#ff9f1c", "#06d6a0", "#ef476f", "#118ab2", "#ffd166", "#8338ec",
  "#3a86ff", "#fb5607", "#ffbe0b", "#ff006e", "#8ac926", "#1982c4"
];

const CREDIT_CATEGORIES = [
  "Alimentação","Vestuário","Eletrônicos","Saúde","Lazer","Transporte",
  "Educação","Viagem","Casa","Assinatura","Beleza","Outros"
];

function getUnusedColor(usedColors) {
  return PALETTE.find(c => !usedColors.includes(c)) || PALETTE[Math.floor(Math.random()*PALETTE.length)];
}

const now = new Date();
const CURRENT_MONTH = now.getMonth();
const CURRENT_YEAR = now.getFullYear();

export default function FinanceiroDashboard() {
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [activeTab, setActiveTab] = useState("visao");

  // Form state (despesas)
  const [form, setForm] = useState({
    id: null,
    entryType: "boleto",
    name: "", type: "fixa", subtype: "serviços",
    amount: "", months: 12, startMonth: CURRENT_MONTH,
    color: "",
    dueDay: 10,
    monthlyTotals: {},
    creditItems: [{ category: "Outros", desc: "", amount: "", type: "variavel", months: 1, itemStartMonth: CURRENT_MONTH }]
  });

  // Form state (receitas)
  const defaultIncomeForm = {
    id: null, type: "salario", name: "", amount: "",
    startMonth: CURRENT_MONTH, endMonth: 11, color: "#b1efd8"
  };
  const [incomeForm, setIncomeForm] = useState(defaultIncomeForm);

  const usedColors = useMemo(() => expenses.map(e => e.color), [expenses]);

  // Persistência localStorage
  useEffect(() => {
    const saved = localStorage.getItem("finctl-expenses");
    if (saved) try { setExpenses(JSON.parse(saved)); } catch {}
    const savedInc = localStorage.getItem("finctl-incomes");
    if (savedInc) try { setIncomes(JSON.parse(savedInc)); } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem("finctl-expenses", JSON.stringify(expenses));
  }, [expenses]);
  useEffect(() => {
    localStorage.setItem("finctl-incomes", JSON.stringify(incomes));
  }, [incomes]);

  // Fechar modais com Escape
  useEffect(() => {
    if (!showModal && !showIncomeModal) return;
    const handler = (e) => {
      if (e.key === "Escape") { setShowModal(false); setShowIncomeModal(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showModal, showIncomeModal]);

  function openModal() {
    const autoColor = getUnusedColor(usedColors);
    setForm({
      id: null,
      entryType: "boleto",
      name: "", type: "fixa", subtype: "serviços",
      amount: "", months: 12, startMonth: CURRENT_MONTH,
      color: autoColor,
      dueDay: 10,
      monthlyTotals: {},
      creditItems: [{ category: "Outros", desc: "", amount: "", type: "variavel", months: 1, itemStartMonth: CURRENT_MONTH }]
    });
    setShowModal(true);
  }

  function selectRegisteredCard(cardExp) {
    setForm({
      id: cardExp.id,
      entryType: "cartao",
      name: cardExp.name,
      type: "cartao",
      subtype: "",
      amount: "",
      months: cardExp.months || 1,
      startMonth: CURRENT_MONTH,
      color: cardExp.color,
      dueDay: cardExp.dueDay || 10,
      monthlyTotals: cardExp.monthlyTotals || {},
      creditItems: cardExp.creditItems || []
    });
  }

  function handleFormChange(field, value) {
    setForm(f => {
      const next = { ...f, [field]: value };
      if (field === "type" && value === "fixa") {
        next.months = 12;
      }
      return next;
    });
  }

  function addCreditItem() {
    setForm(f => ({ ...f, creditItems: [...f.creditItems, { category: "Outros", desc: "", amount: "", type: "variavel", months: 1, itemStartMonth: f.startMonth }] }));
  }

  function updateCreditItem(idx, field, value) {
    setForm(f => {
      const items = [...f.creditItems];
      items[idx] = { ...items[idx], [field]: value };
      return { ...f, creditItems: items };
    });
  }

  function removeCreditItem(idx) {
    setForm(f => ({ ...f, creditItems: f.creditItems.filter((_, i) => i !== idx) }));
  }

  function saveExpense() {
    if (!form.name || (!form.amount && form.entryType !== "cartao")) return;
    const totalAmount = form.entryType === "cartao"
      ? form.creditItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
      : parseFloat(form.amount) || 0;

    const exp = {
      id: form.id || Date.now(),
      entryType: form.entryType,
      name: form.name,
      type: form.entryType === "cartao" ? "cartao" : form.type,
      subtype: form.entryType === "cartao" ? "" : form.subtype,
      amount: totalAmount,
      months: parseInt(form.months),
      startMonth: parseInt(form.startMonth),
      color: form.color,
      dueDay: form.dueDay,
      monthlyTotals: form.monthlyTotals,
      creditItems: form.entryType === "cartao" ? form.creditItems : [],
    };
    
    if (form.id) {
      setExpenses(prev => prev.map(p => p.id === form.id ? exp : p));
    } else {
      setExpenses(prev => [...prev, exp]);
    }
    
    setShowModal(false);
  }

  function deleteExpense(id) {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }

  // ---- Receitas ----
  function openIncomeModal(income = null) {
    if (income) {
      setIncomeForm({ ...income });
    } else {
      setIncomeForm({ ...defaultIncomeForm });
    }
    setShowIncomeModal(true);
  }

  function handleIncomeFormChange(field, value) {
    setIncomeForm(f => ({ ...f, [field]: value }));
  }

  function saveIncome() {
    if (!incomeForm.name || !incomeForm.amount) return;
    const inc = {
      id: incomeForm.id || Date.now(),
      type: incomeForm.type,
      name: incomeForm.name,
      amount: parseFloat(incomeForm.amount) || 0,
      startMonth: parseInt(incomeForm.startMonth),
      endMonth: parseInt(incomeForm.endMonth),
      color: incomeForm.color || "#b1efd8",
    };
    if (incomeForm.id) {
      setIncomes(prev => prev.map(i => i.id === incomeForm.id ? inc : i));
    } else {
      setIncomes(prev => [...prev, inc]);
    }
    setShowIncomeModal(false);
  }

  function deleteIncome(id) {
    setIncomes(prev => prev.filter(i => i.id !== id));
  }

  function getMonthIncomes(monthIdx) {
    return incomes.filter(inc => {
      const { startMonth, endMonth } = inc;
      if (startMonth <= endMonth) return monthIdx >= startMonth && monthIdx <= endMonth;
      return monthIdx >= startMonth || monthIdx <= endMonth; // wrap
    });
  }

  function isItemActive(item, monthIdx, expenseStartMonth) {
     const itemMonths = item.type === "fixa" ? 12 : (item.months || 1);
     const start = item.itemStartMonth !== undefined ? item.itemStartMonth : expenseStartMonth;
     const end = (start + itemMonths - 1) % 12;
     const wraps = (start + itemMonths - 1) > 11;
     if (!wraps) return monthIdx >= start && monthIdx <= end;
     return monthIdx >= start || monthIdx <= end;
  }

  const getMonthExpenses = useCallback((monthIdx) => {
    return expenses.map(e => {
      if (e.entryType === "cartao") { // Dynamically filter items for this month context
        const activeItems = (e.creditItems || []).filter(i => isItemActive(i, monthIdx, e.startMonth));
        let sumActive = activeItems.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
        
        const invoiceObj = e.monthlyTotals || {};
        const invoiceTotal = parseFloat(invoiceObj[monthIdx]) || 0;
        
        if (invoiceTotal > sumActive) {
          activeItems.push({
            category: "Outros", desc: "Não detalhado", amount: (invoiceTotal - sumActive).toFixed(2),
            type: "variavel", months: 1, itemStartMonth: monthIdx, isVirtual: true
          });
          sumActive = invoiceTotal;
        }

        return { 
          ...e, 
          creditItems: activeItems, 
          amount: sumActive 
        };
      }
      return e;
    }).filter(e => {
      if (e.entryType === "cartao") return e.creditItems.length > 0;
      // Normal filter
      const end = (e.startMonth + e.months - 1) % 12;
      const wraps = (e.startMonth + e.months - 1) > 11;
      if (!wraps) return monthIdx >= e.startMonth && monthIdx <= end;
      return monthIdx >= e.startMonth || monthIdx <= end;
    });
  }, [expenses]);

  const monthExpenses = useMemo(() => getMonthExpenses(selectedMonth), [getMonthExpenses, selectedMonth]);
  const totalMonth = useMemo(() => monthExpenses.reduce((s, e) => s + e.amount, 0), [monthExpenses]);
  const fixaTotal = useMemo(() => monthExpenses.reduce((s, e) => {
    if (e.entryType === "cartao") return s + (e.creditItems || []).filter(i => i.type === "fixa").reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
    return e.type === "fixa" ? s + e.amount : s;
  }, 0), [monthExpenses]);
  const varTotal = useMemo(() => monthExpenses.reduce((s, e) => {
    if (e.entryType === "cartao") return s + (e.creditItems || []).filter(i => i.type !== "fixa").reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
    return e.type === "variavel" ? s + e.amount : s;
  }, 0), [monthExpenses]);

  // Receitas do mês selecionado
  const monthIncomes = useMemo(() => getMonthIncomes(selectedMonth), [incomes, selectedMonth]);
  const totalIncomeMonth = useMemo(() => monthIncomes.reduce((s, i) => s + i.amount, 0), [monthIncomes]);
  const balanceMonth = useMemo(() => totalIncomeMonth - totalMonth, [totalIncomeMonth, totalMonth]);

  // Year overview
  const yearData = useMemo(() => MONTHS.map((_, idx) => ({
    month: idx,
    total: getMonthExpenses(idx).reduce((s, e) => s + e.amount, 0),
    income: getMonthIncomes(idx).reduce((s, i) => s + i.amount, 0),
  })), [getMonthExpenses, incomes]);
  const maxYear = useMemo(() => Math.max(...yearData.map(d => Math.max(d.total, d.income)), 1), [yearData]);

  // Grouped for MENSAL tab
  const { fixas, variaveis, cartoes } = useMemo(() => ({
    fixas: monthExpenses.filter(e => e.type === "fixa"),
    variaveis: monthExpenses.filter(e => e.type === "variavel"),
    cartoes: monthExpenses.filter(e => e.entryType === "cartao"),
  }), [monthExpenses]);

  // Available colors
  const availableColors = useMemo(() => PALETTE.filter(c => !usedColors.includes(c) || c === form.color), [usedColors, form.color]);

  // Totais dinâmicos da fatura no formulário
  const { currentCardFixaTotal, currentCardVarTotal, currentCardTotal } = useMemo(() => {
    const month = form.startMonth;
    const activeItems = (form.creditItems || []).filter(i => isItemActive(
      { ...i, itemStartMonth: i.itemStartMonth !== undefined ? i.itemStartMonth : form.startMonth },
      month, form.startMonth
    ));
    let fixaT = activeItems.filter(i => i.type === "fixa").reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    let varT = activeItems.filter(i => i.type !== "fixa").reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    const invoiceTotal = parseFloat((form.monthlyTotals || {})[month]) || 0;
    if (invoiceTotal > fixaT + varT) varT += invoiceTotal - (fixaT + varT);
    return { currentCardFixaTotal: fixaT, currentCardVarTotal: varT, currentCardTotal: fixaT + varT };
  }, [form.startMonth, form.creditItems, form.monthlyTotals]);

  // STYLES object for neo-brutalism layout within JSX
  const baseLayout = {
    padding: "20px 32px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    borderBottom: "var(--stroke)",
    backgroundColor: "var(--background)"
  };

  const tabsInfo = [
    { key: "visao", label: "Visão Geral", icon: "monitoring" },
    { key: "mensal", label: "Mensal", icon: "calendar_month" },
    { key: "lista", label: "Receitas/Despesas", icon: "receipt_long" },
    { key: "estatisticas", label: "Estatísticas", icon: "analytics" }
  ];

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 64 }}>
      {/* Header */}
      <div style={baseLayout}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <h1 style={{ fontSize: "2.5rem", letterSpacing: "-1px", fontWeight: 800 }}>
            FINCTL <span style={{ fontSize: "1rem", fontWeight: 500, letterSpacing: "2px", border: "var(--stroke)", borderRadius: "var(--radius-sm)", padding: "2px 8px", backgroundColor: "var(--primary)", verticalAlign: "middle" }}>{CURRENT_YEAR}</span>
          </h1>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="neo-btn" style={{ backgroundColor: "var(--secondary)", display: "flex", alignItems: "center", gap: 8 }} onClick={() => openIncomeModal()}>
            <span className="material-symbols-outlined">add</span> Receita
          </button>
          <button className="neo-btn" style={{ backgroundColor: "var(--primary)", display: "flex", alignItems: "center", gap: 8 }} onClick={openModal}>
            <span className="material-symbols-outlined">add</span> Despesa
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "var(--stroke)", padding: "0 32px", backgroundColor: "var(--surface-lowest)", overflowX: "auto" }}>
        {tabsInfo.map(({ key, label, icon }) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            background: activeTab === key ? "var(--primary)" : "transparent",
            border: "none",
            borderRight: "var(--stroke)",
            borderLeft: key === "visao" ? "var(--stroke)" : "none",
            borderTop: activeTab === key ? "var(--stroke)" : "none",
            color: "var(--on-surface)",
            fontFamily: "var(--font-heading)",
            fontSize: "1.1rem",
            fontWeight: activeTab === key ? 700 : 500,
            padding: "16px 24px",
            cursor: "pointer",
            borderBottom: activeTab === key ? "none" : "transparent",
            boxShadow: activeTab === key ? "4px -4px 0px var(--border-color)" : "none",
            transform: activeTab === key ? "translateY(2px)" : "none",
            transition: "all 0.1s",
            whiteSpace: "nowrap"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="material-symbols-outlined">{icon}</span>
              {label}
            </div>
          </button>
        ))}
      </div>

      <div style={{ padding: "40px 32px", maxWidth: 1200, margin: "0 auto" }}>

        {/* VISÃO GERAL */}
        {activeTab === "visao" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            
            {/* Top Stats Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
              {[
                { label: "Total Anual Despesas", value: yearData.reduce((s, d) => s + d.total, 0), bgColor: "var(--primary)" },
                { label: "Total Anual Receitas", value: yearData.reduce((s, d) => s + d.income, 0), bgColor: "var(--secondary)" },
                { label: "Saldo Anual", value: yearData.reduce((s, d) => s + d.income - d.total, 0), bgColor: yearData.reduce((s, d) => s + d.income - d.total, 0) >= 0 ? "var(--secondary)" : "var(--error)" },
              ].map(({ label, value, bgColor }) => (
                <div key={label} className="neo-card" style={{ backgroundColor: bgColor }}>
                  <h3 style={{ fontSize: "1rem", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px", fontWeight: 700 }}>{label}</h3>
                  <div className="display-num" style={{ fontSize: "3rem", fontWeight: 800 }}>
                    R$ {value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>

            {/* Annual Chart */}
            <div className="neo-card" style={{ padding: "32px 40px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
                <h2 style={{ fontSize: "1.5rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="material-symbols-outlined">bar_chart</span> Visão Anual
                </h2>
                <div style={{ display: "flex", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}><div style={{ width: 16, height: 16, backgroundColor: "var(--primary)", border: "var(--stroke)" }}></div> Despesas</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}><div style={{ width: 16, height: 16, backgroundColor: "var(--secondary)", border: "var(--stroke)" }}></div> Receitas</div>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end", height: 200, borderBottom: "var(--stroke)", paddingBottom: 8 }}>
                {yearData.map(({ month, total, income }) => (
                  <div key={month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: "0.75rem", textAlign: "center", fontWeight: 700, minHeight: 32 }}>
                      {income > 0 && <div>{`R$${(income/1000).toFixed(1)}k`}</div>}
                      {total > 0 && <div>{`R$${(total/1000).toFixed(1)}k`}</div>}
                    </div>
                    
                    <div style={{ width: "100%", padding: "0 4px", display: "flex", alignItems: "flex-end", height: 140, cursor: "pointer", position: "relative" }}
                         onClick={() => { setSelectedMonth(month); setActiveTab("mensal"); }}>
                         
                      {/* Despesa Bar */}
                      <div style={{
                        position: "absolute", bottom: 0, left: 4, right: 4,
                        backgroundColor: total > 0 ? "var(--primary)" : "var(--surface-low)",
                        border: total > 0 ? "var(--stroke)" : "none",
                        height: `${Math.max((total / maxYear) * 140, total > 0 ? 8 : 4)}px`,
                        transition: "all 0.2s"
                      }} />
                      
                      {/* Receita Bar */}
                      <div style={{
                        position: "absolute", bottom: 0, left: 16, right: -8,
                        backgroundColor: income > 0 ? "var(--secondary)" : "transparent",
                        border: income > 0 ? "var(--stroke)" : "none",
                        height: `${Math.max((income / maxYear) * 140, income > 0 ? 8 : 0)}px`,
                        zIndex: 2,
                        transition: "all 0.2s"
                      }} />
                    </div>
                    
                    <div style={{ fontWeight: 800, textTransform: "uppercase", marginTop: 8, fontSize: "0.85rem" }}>
                      {MONTHS[month]}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags Overview */}
            <div style={{ display: "flex", gap: 32 }}>
              {expenses.length > 0 && (
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "1.2rem", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="material-symbols-outlined">sell</span> Despesas na Memória
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                    {expenses.map(e => (
                      <div key={e.id} className="tag-chip" style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "#ffffff", padding: "6px 12px" }}>
                        <div style={{ width: 12, height: 12, backgroundColor: e.color, border: "2px solid #000", borderRadius: "50%" }} />
                        <span>{e.name}</span>
                        <span style={{ opacity: 0.6 }}>R${e.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MENSAL */}
        {activeTab === "mensal" && (
          <div>
            {/* Month selector using Neo-Brutalism tags */}
            <div style={{ display: "flex", gap: 12, marginBottom: 40, flexWrap: "wrap" }}>
              {MONTHS.map((m, idx) => {
                const hasExp = getMonthExpenses(idx).length > 0;
                return (
                  <button key={idx} onClick={() => setSelectedMonth(idx)} style={{
                    backgroundColor: selectedMonth === idx ? "var(--primary)" : hasExp ? "#ffffff" : "var(--surface-low)",
                    border: "var(--stroke)",
                    boxShadow: selectedMonth === idx ? "var(--shadow-block)" : "none",
                    transform: selectedMonth === idx ? "translate(-2px, -2px)" : "none",
                    borderRadius: "var(--radius-md)",
                    padding: "8px 20px", fontFamily: "var(--font-heading)", fontSize: "1rem",
                    cursor: "pointer", fontWeight: 700
                  }}>{m}</button>
                );
              })}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 32 }}>
              <div>
                <h2 style={{ fontSize: "2rem", marginBottom: 24, paddingBottom: 16, borderBottom: "var(--stroke)" }}>
                   Lançamentos de {MONTHS[selectedMonth]}
                </h2>
                
                {monthExpenses.length === 0 ? (
                  <div className="neo-card" style={{ textAlign: "center", padding: "64px 20px", backgroundColor: "#ffffff" }}>
                    <h3>Nenhuma despesa para este mês.</h3>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    
                    {fixas.length > 0 && <ListSection title={<><span className="material-symbols-outlined">lock</span> Fixas</>} items={fixas} onDelete={deleteExpense} accentColor="var(--error)" />}
                    {variaveis.length > 0 && <ListSection title={<><span className="material-symbols-outlined">sync_alt</span> Variáveis</>} items={variaveis} onDelete={deleteExpense} accentColor="var(--secondary)" />}
                    {cartoes.length > 0 && <ListSection title={<><span className="material-symbols-outlined">credit_card</span> Cartões de Crédito</>} items={cartoes} onDelete={deleteExpense} accentColor="var(--tertiary)" />}

                  </div>
                )}
                
                {monthIncomes.length > 0 && (
                  <div style={{ marginTop: 32 }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: 12, display: "inline-flex", alignItems: "center", gap: 8, borderBottom: "4px solid var(--secondary)" }}>
                      <span className="material-symbols-outlined">payments</span> Receitas
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {monthIncomes.map(inc => (
                        <div key={inc.id} className="neo-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, backgroundColor: "#ffffff" }}>
                          <div style={{ width: 16, height: 16, backgroundColor: inc.color, border: "2px solid #000", borderRadius: "50%", flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>{inc.name}</div>
                            <div className="tag-chip" style={{ display: "inline-block", marginTop: 4 }}>{inc.type}</div>
                          </div>
                          <span style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                            + R$ {inc.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
              
              {/* Resumo Lateral */}
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div className="neo-card" style={{ backgroundColor: balanceMonth >= 0 ? "var(--secondary)" : "var(--error)" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 8 }}>Saldo Mês</h3>
                  <div className="display-num" style={{ fontSize: "2.5rem", fontWeight: 800 }}>
                    R$ {balanceMonth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                
                <div className="neo-card" style={{ backgroundColor: "#ffffff", padding: "20px" }}>
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, opacity: 0.7 }}>Receitas</h4>
                    <div className="display-num" style={{ fontSize: "1.75rem", fontWeight: 800 }}>R$ {totalIncomeMonth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div style={{ borderTop: "var(--stroke)", paddingTop: 16 }}>
                    <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, opacity: 0.7 }}>Despesas</h4>
                    <div className="display-num" style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--error)" }}>R$ {totalMonth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: "0.9rem", fontWeight: 600 }}>
                      <span>Fixas:</span> <span>R$ {fixaTotal.toLocaleString()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: "0.9rem", fontWeight: 600 }}>
                      <span>Variáveis:</span> <span>R$ {varTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LISTA DE TODAS (Receitas e Despesas separadas) */}
        {activeTab === "lista" && (() => {
          const renderCard = (item) => (
            <div key={`${item.isIncome ? 'inc' : 'exp'}-${item.id}`} className="neo-card" style={{ backgroundColor: "#ffffff", position: "relative", padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
              <button onClick={() => item.isIncome ? deleteIncome(item.id) : deleteExpense(item.id)} style={{ position: "absolute", top: 16, right: 16, background: "var(--error)", border: "var(--stroke)", borderRadius: "var(--radius-sm)", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>delete</span>
              </button>

              {item.isIncome && (
                <button onClick={() => openIncomeModal(item)} style={{ position: "absolute", top: 16, right: 56, background: "var(--primary)", border: "var(--stroke)", borderRadius: "var(--radius-sm)", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>edit</span>
                </button>
              )}
              
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 24, height: 24, backgroundColor: item.color, border: "var(--stroke)", borderRadius: "50%", boxShadow: "2px 2px 0 #0e0f09" }} />
                <h3 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, paddingRight: item.isIncome ? 76 : 36 }}>{item.name}</h3>
              </div>
              
              <div className="display-num" style={{ fontSize: "2rem", fontWeight: 800, color: item.isIncome ? "var(--secondary)" : "inherit" }}>
                {item.isIncome ? "+ " : "- "} R$ {item.amount.toFixed(2)}
              </div>
              
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderTop: "2px dashed var(--border-color)", paddingTop: 16 }}>
                <span className="tag-chip" style={{ backgroundColor: item.isIncome ? "var(--secondary)" : "var(--error)" }}>
                   {item.isIncome ? "Receita" : "Despesa"}
                </span>
                <span className="tag-chip" style={{ backgroundColor: "var(--surface-low)" }}>{item.type || item.entryType}</span>
                
                {item.isIncome ? (
                   <span className="tag-chip">{MONTHS[item.startMonth]} → {MONTHS[item.endMonth]}</span>
                ) : (
                   item.entryType !== "cartao" ? (
                     <span className="tag-chip">{MONTHS[item.startMonth]} → {MONTHS[(item.startMonth + item.months - 1) % 12]}</span>
                   ) : (
                     <span className="tag-chip">Dia {item.dueDay}</span>
                   )
                )}
              </div>
            </div>
          );

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
              {/* === RECEITAS === */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 16, borderBottom: "4px solid var(--secondary)" }}>
                  <h2 style={{ fontSize: "2rem", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="material-symbols-outlined">payments</span> Receitas
                  </h2>
                  <span className="tag-chip" style={{ backgroundColor: "var(--secondary)", fontSize: "1rem" }}>Total: {incomes.length}</span>
                </div>
                
                {incomes.length === 0 ? (
                  <div className="neo-card" style={{ textAlign: "center", padding: "40px 20px" }}>
                    <h3>Nenhuma receita cadastrada</h3>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
                    {incomes.map(i => ({ ...i, isIncome: true })).sort((a, b) => b.id - a.id).map(renderCard)}
                  </div>
                )}
              </div>

              {/* === DESPESAS === */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 16, borderBottom: "4px solid var(--error)" }}>
                  <h2 style={{ fontSize: "2rem", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="material-symbols-outlined">receipt_long</span> Despesas
                  </h2>
                  <span className="tag-chip" style={{ backgroundColor: "var(--error)", fontSize: "1rem" }}>Total: {expenses.length}</span>
                </div>
                
                {expenses.length === 0 ? (
                  <div className="neo-card" style={{ textAlign: "center", padding: "40px 20px" }}>
                    <h3>Nenhuma despesa cadastrada</h3>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
                    {expenses.map(e => ({ ...e, isIncome: false })).sort((a, b) => b.id - a.id).map(renderCard)}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ESTATÍSTICAS (Antiga "Receitas") */}
        {activeTab === "estatisticas" && (
          <div>
            <h2 style={{ fontSize: "2rem", marginBottom: 24, paddingBottom: 16, borderBottom: "var(--stroke)" }}>Estatísticas Detalhadas</h2>
            
            {(() => {
               const totalRecAnual = yearData.reduce((s, d) => s + d.income, 0);
               const totalDespAnual = yearData.reduce((s, d) => s + d.total, 0);
               
               let totalCartoes = 0, totalFixas = 0, totalVar = 0;
               for (let i = 0; i < 12; i++) {
                 const mExp = getMonthExpenses(i);
                 totalCartoes += mExp.filter(e => e.entryType === "cartao").reduce((s, e) => s + e.amount, 0);
                 totalFixas += mExp.filter(e => e.type === "fixa" && e.entryType !== "cartao").reduce((s, e) => s + e.amount, 0);
                 totalVar += mExp.filter(e => e.type === "variavel" && e.entryType !== "cartao").reduce((s, e) => s + e.amount, 0);
               }

               return (
                 <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                       
                       {/* Composição das Despesas */}
                       <div className="neo-card" style={{ backgroundColor: "#ffffff" }}>
                         <h3 style={{ borderBottom: "var(--stroke)", paddingBottom: 16, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
                            <span className="material-symbols-outlined">pie_chart</span> Composição das Despesas
                         </h3>
                         <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                           <StatBar label="Cartões de Crédito" value={totalCartoes} total={totalDespAnual} color="var(--tertiary)" />
                           <StatBar label="Despesas Fixas" value={totalFixas} total={totalDespAnual} color="var(--error)" />
                           <StatBar label="Despesas Variáveis" value={totalVar} total={totalDespAnual} color="var(--primary)" />
                         </div>
                       </div>
                       
                       {/* Médias e Resumo Anual */}
                       <div className="neo-card" style={{ backgroundColor: "#ffffff" }}>
                         <h3 style={{ borderBottom: "var(--stroke)", paddingBottom: 16, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
                             <span className="material-symbols-outlined">trending_up</span> Resumo e Médias
                         </h3>
                         
                         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div className="neo-card" style={{ backgroundColor: "var(--surface-low)", padding: "16px" }}>
                               <div style={{ fontSize: "0.80rem", fontWeight: 800, textTransform: "uppercase", marginBottom: 8 }}>Média Despesa / Mês</div>
                               <div className="display-num" style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--error)" }}>R$ {(totalDespAnual / 12).toFixed(2)}</div>
                            </div>
                            <div className="neo-card" style={{ backgroundColor: "var(--surface-low)", padding: "16px" }}>
                               <div style={{ fontSize: "0.80rem", fontWeight: 800, textTransform: "uppercase", marginBottom: 8 }}>Média Receita / Mês</div>
                               <div className="display-num" style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--secondary)" }}>R$ {(totalRecAnual / 12).toFixed(2)}</div>
                            </div>
                            
                            <div className="neo-card" style={{ gridColumn: "1 / -1", backgroundColor: (totalRecAnual - totalDespAnual) >= 0 ? "var(--secondary)" : "var(--error)", padding: "16px" }}>
                               <div style={{ fontSize: "0.80rem", fontWeight: 800, textTransform: "uppercase", marginBottom: 8 }}>Balanço Líquido (Ano)</div>
                               <div className="display-num" style={{ fontSize: "2.2rem", fontWeight: 800 }}>R$ {(totalRecAnual - totalDespAnual).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                            </div>
                         </div>
                       </div>
                       
                    </div>
                 </div>
               );
            })()}
          </div>
        )}
      </div>

      {/* Modal Despesa */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="neo-modal">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, borderBottom: "var(--stroke)", paddingBottom: 16 }}>
              <h2 style={{ fontSize: "2rem", margin: 0 }}>{form.id ? "Editar Lançamento" : "Nova Despesa"}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "2rem" }}>close</span>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              
              <Field label="Tipo de Cadastro">
                <div style={{ display: "flex", gap: 12 }}>
                  {[["boleto","Boleto"],["extra","Despesa Extra"],["cartao","Cartão"]].map(([val, lab]) => (
                    <button key={val} onClick={() => handleFormChange("entryType", val)} style={{
                      flex: 1, backgroundColor: form.entryType === val ? "var(--primary)" : "#ffffff",
                      border: "var(--stroke)", borderRadius: "var(--radius-md)",
                      padding: "12px", fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, cursor: "pointer",
                      boxShadow: form.entryType === val ? "var(--shadow-block)" : "none", transform: form.entryType === val ? "translate(-2px, -2px)" : "none"
                    }}>{lab}</button>
                  ))}
                </div>
              </Field>

              {form.entryType === "cartao" && (
                <div style={{ backgroundColor: "var(--tertiary)", border: "var(--stroke)", borderRadius: "var(--radius-md)", padding: 16, boxShadow: "var(--shadow-block)" }}>
                   <div style={{ fontWeight: 800, marginBottom: 12 }}>Cartões Registrados:</div>
                   {expenses.filter(e => e.entryType === "cartao").length === 0 ? (
                      <p style={{ margin: 0 }}>Nenhum cartão. O preenchimento abaixo criará um novo.</p>
                   ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {expenses.filter(e => e.entryType === "cartao").map(e => {
                          const isSelected = form.id === e.id;
                          return (
                            <div key={e.id} onClick={() => selectRegisteredCard(e)} style={{
                              backgroundColor: isSelected ? "var(--primary)" : "#ffffff", border: "var(--stroke)", borderRadius: "var(--radius-sm)",
                              padding: "8px 12px", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 8,
                              transform: isSelected ? "translate(-2px, -2px)" : "none", boxShadow: isSelected ? "var(--shadow-block)" : "none"
                            }}>
                              <div style={{ width: 12, height: 12, backgroundColor: e.color, borderRadius: "50%", border: "2px solid #000" }}></div>
                              {e.name}
                            </div>
                          );
                        })}
                      </div>
                   )}
                </div>
              )}

              <Field label={form.entryType === "cartao" ? "Nome do Cartão" : "Nome da Despesa"}>
                <Input value={form.name} onChange={v => handleFormChange("name", v)} placeholder="Ex: Conta de Luz, Itaú..." />
              </Field>

              {form.entryType !== "cartao" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Field label="Tipo da Despesa">
                    <select className="neo-select" value={form.type} onChange={e => handleFormChange("type", e.target.value)}>
                      <option value="fixa">Fixa</option>
                      <option value="variavel">Variável</option>
                    </select>
                  </Field>
                  <Field label="Categoria">
                    <select className="neo-select" value={form.subtype} onChange={e => handleFormChange("subtype", e.target.value)}>
                      <option value="serviços">Serviços</option>
                      <option value="lazer">Lazer</option>
                      <option value="saúde">Saúde</option>
                      <option value="casa">Casa</option>
                      <option value="outro">Outro</option>
                    </select>
                  </Field>
                  <Field label="Valor (R$)">
                    <Input value={form.amount} onChange={v => handleFormChange("amount", v)} placeholder="0.00" type="number" />
                  </Field>
                  <Field label="Mês Base">
                    <select className="neo-select" value={form.startMonth} onChange={e => handleFormChange("startMonth", parseInt(e.target.value))}>
                      {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                  </Field>
                  <div style={{ gridColumn: "1 / -1" }}>
                     <Field label={`Parcelas / Meses: ${form.months}x`}>
                       <input type="range" min={1} max={12} value={form.months} disabled={form.type === "fixa"}
                              onChange={e => handleFormChange("months", parseInt(e.target.value))}
                              style={{ width: "100%", accentColor: "var(--border-color)", cursor: form.type === "fixa" ? "not-allowed" : "pointer" }} />
                     </Field>
                  </div>
                </div>
              )}

              {form.entryType === "cartao" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                    <Field label="Vencimento (Dia)">
                      <Input value={form.dueDay} onChange={v => handleFormChange("dueDay", parseInt(v) || 1)} type="number" min="1" max="31" />
                    </Field>
                    <Field label="Mês Fatura">
                      <select className="neo-select" value={form.startMonth} onChange={e => handleFormChange("startMonth", parseInt(e.target.value))}>
                        {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                      </select>
                    </Field>
                    <Field label="Fatura Fechada (R$)">
                       <Input value={form.monthlyTotals?.[form.startMonth] || ""} 
                              onChange={v => { const newMT = { ...form.monthlyTotals, [form.startMonth]: v }; if (!v) delete newMT[form.startMonth]; handleFormChange("monthlyTotals", newMT); }} 
                              type="number" />
                    </Field>
                  </div>
                  
                  <div className="neo-card" style={{ backgroundColor: "#ffffff", padding: "24px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                      <h3 style={{ margin: 0, fontWeight: 800 }}>Itens Detalhados</h3>
                      <div className="display-num" style={{ fontSize: "1.5rem", fontWeight: 800 }}>R$ {currentCardTotal.toFixed(2)}</div>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {form.creditItems.map((item, idx) => (
                        <div key={idx} style={{ display: "flex", gap: 8 }}>
                          <select className="neo-select" style={{ width: 90 }} value={item.type || "variavel"} onChange={e => updateCreditItem(idx, "type", e.target.value)}>
                            <option value="fixa">Fixa</option><option value="variavel">Var</option>
                          </select>
                          <select className="neo-select" style={{ width: 110 }} value={item.category} onChange={e => updateCreditItem(idx, "category", e.target.value)}>
                            {CREDIT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                          </select>
                          <Input style={{ flex: 2 }} value={item.desc} onChange={v => updateCreditItem(idx, "desc", v)} placeholder="Desc" />
                          <Input style={{ flex: 1 }} value={item.amount} onChange={v => updateCreditItem(idx, "amount", v)} placeholder="R$" type="number" />
                          {item.type === "variavel" ? (
                            <Input style={{ width: 70 }} value={item.months || 1} onChange={v => updateCreditItem(idx, "months", parseInt(v) || 1)} type="number" min="1" />
                          ) : (
                            <div style={{ width: 70, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>12x</div>
                          )}
                          <button onClick={() => removeCreditItem(idx)} disabled={form.creditItems.length <= 1} style={{ width: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--error)", border: "var(--stroke)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontWeight: 800 }}>
                             <span className="material-symbols-outlined" style={{ fontSize: "1.2rem" }}>close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button onClick={addCreditItem} className="neo-btn" style={{ backgroundColor: "var(--surface-highest)", width: "100%", marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <span className="material-symbols-outlined">add</span> Adicionar Item
                    </button>
                  </div>
                </>
              )}

              <Field label="Cor Identificadora">
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: 8, border: "2px dashed var(--border-color)", borderRadius: "var(--radius-md)" }}>
                  {availableColors.slice(0, 14).map(c => (
                    <div key={c} onClick={() => handleFormChange("color", c)} style={{
                      width: 32, height: 32, backgroundColor: c, border: "2px solid #000",
                      borderRadius: "50%", cursor: "pointer",
                      boxShadow: form.color === c ? "0 0 0 4px var(--border-color)" : "var(--shadow-hover)",
                      transform: form.color === c ? "scale(1.1)" : "none"
                    }} />
                  ))}
                </div>
              </Field>

            </div>

            <div style={{ display: "flex", gap: 16, marginTop: 40 }}>
              {form.id && <button onClick={() => { deleteExpense(form.id); setShowModal(false); }} className="neo-btn" style={{ backgroundColor: "var(--error)", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span className="material-symbols-outlined">delete</span> Excluir</button>}
              <button onClick={() => setShowModal(false)} className="neo-btn" style={{ backgroundColor: "#ffffff", flex: 1 }}>Cancelar</button>
              <button onClick={saveExpense} className="neo-btn" style={{ flex: 2 }}>{form.id ? "Atualizar" : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Receita */}
      {showIncomeModal && (
        <div className="modal-backdrop">
          <div className="neo-modal">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, borderBottom: "var(--stroke)", paddingBottom: 16 }}>
              <h2 style={{ fontSize: "2rem", margin: 0 }}>{incomeForm.id ? "Editar Receita" : "Nova Receita"}</h2>
              <button onClick={() => setShowIncomeModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "2rem" }}>close</span>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <Field label="Tipo de Receita">
                <div style={{ display: "flex", gap: 12 }}>
                  {[["salario","Salário"],["extra","Renda Extra"]].map(([val, lab]) => (
                    <button key={val} onClick={() => handleIncomeFormChange("type", val)} style={{
                      flex: 1, backgroundColor: incomeForm.type === val ? "var(--secondary)" : "#ffffff",
                      border: "var(--stroke)", borderRadius: "var(--radius-md)",
                      padding: "12px", fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, cursor: "pointer",
                      boxShadow: incomeForm.type === val ? "var(--shadow-block)" : "none", transform: incomeForm.type === val ? "translate(-2px, -2px)" : "none"
                    }}>{lab}</button>
                  ))}
                </div>
              </Field>

              <Field label="Descrição">
                <Input value={incomeForm.name} onChange={v => handleIncomeFormChange("name", v)} placeholder="Ex: Salário..." />
              </Field>

              <Field label="Valor (R$)">
                <Input value={incomeForm.amount} onChange={v => handleIncomeFormChange("amount", v)} type="number" />
              </Field>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Mês Inicial">
                  <select className="neo-select" value={incomeForm.startMonth} onChange={e => handleIncomeFormChange("startMonth", parseInt(e.target.value))}>
                    {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Mês Final">
                  <select className="neo-select" value={incomeForm.endMonth} onChange={e => handleIncomeFormChange("endMonth", parseInt(e.target.value))}>
                    {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            <div style={{ display: "flex", gap: 16, marginTop: 40 }}>
              {incomeForm.id && <button onClick={() => { deleteIncome(incomeForm.id); setShowIncomeModal(false); }} className="neo-btn" style={{ backgroundColor: "var(--error)", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span className="material-symbols-outlined">delete</span> Excluir</button>}
              <button onClick={() => setShowIncomeModal(false)} className="neo-btn" style={{ backgroundColor: "#ffffff", flex: 1 }}>Cancelar</button>
              <button onClick={saveIncome} className="neo-btn" style={{ backgroundColor: "var(--secondary)", flex: 2 }}>{incomeForm.id ? "Atualizar" : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Helpers Components
function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: "0.85rem", fontWeight: 800, marginBottom: 8, textTransform: "uppercase" }}>{label}</div>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = "text", placeholder, style = {} }) {
  return (
    <input className="neo-input" value={value} type={type} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={style} />
  );
}

function StatBar({ label, value, total, color }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontWeight: 700, fontSize: "0.9rem" }}>
        <span>{label}</span>
        <span>{percentage}% (R$ {value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})</span>
      </div>
      <div style={{ width: "100%", height: 16, backgroundColor: "var(--surface-lowest)", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "var(--stroke)", display: "flex" }}>
        <div style={{ height: "100%", width: `${percentage}%`, backgroundColor: color, borderRight: percentage < 100 && percentage > 0 ? "var(--stroke)" : "none" }}></div>
      </div>
    </div>
  );
}

function ListSection({ title, items, onDelete, accentColor }) {
  return (
    <div>
      <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: 12, display: "flex", alignItems: "center", gap: 8, borderBottom: `4px solid ${accentColor}` }}>{title}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map(e => (
          <ExpenseRow key={e.id} e={e} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

function ExpenseRow({ e, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="neo-card" style={{ padding: "16px", backgroundColor: "#ffffff", boxShadow: "2px 2px 0 var(--border-color)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 16, height: 16, backgroundColor: e.color, border: "2px solid #000", borderRadius: "50%", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>{e.name}</div>
          <div className="tag-chip" style={{ display: "inline-block", marginTop: 4, opacity: 0.8 }}>
             {e.entryType === "cartao" ? `Venc: Dia ${e.dueDay}` : e.subtype}
          </div>
        </div>
        <span className="display-num" style={{ fontSize: "1.4rem", fontWeight: 800 }}>
          R$ {e.amount.toFixed(2)}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          {e.creditItems?.length > 0 && (
            <button onClick={() => setExpanded(!expanded)} className="neo-btn" style={{ padding: "4px 8px", backgroundColor: "var(--surface-low)", display: "flex", alignItems: "center" }}>
               <span className="material-symbols-outlined">{expanded ? "expand_less" : "expand_more"}</span>
            </button>
          )}
          <button onClick={() => onDelete(e.id)} className="neo-btn" style={{ padding: "4px 8px", backgroundColor: "var(--error)", display: "flex", alignItems: "center" }}>
             <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>
      
      {expanded && e.creditItems?.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "2px dashed var(--border-color)", display: "flex", flexWrap: "wrap", gap: 8 }}>
          {e.creditItems.map((ci, i) => (
            <div key={i} className="tag-chip" style={{ display: "flex", alignItems: "center", gap: 4, backgroundColor: ci.type === "fixa" ? "var(--error)" : "var(--secondary)", fontSize: "0.8rem", padding: "6px 12px" }}>
              {ci.isVirtual ? <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>electric_bolt</span> : null}
              {ci.category}{ci.desc ? ` · ${ci.desc}` : ""} — R${parseFloat(ci.amount || 0).toFixed(2)} {ci.type === "variavel" && (ci.months || 1) > 1 ? `(${ci.months}x)` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
