(() => {
  const STORAGE_KEY = "dataplatform-prototype:v2";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const nowIso = () => new Date().toISOString();
  const uid = (p) => `${p}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  const esc = (v) =>
    String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  const fmtTime = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  const toast = (title, desc = "", tone = "info") => {
    const host = $("#toastHost");
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<div class="toast__t">${esc(title)}</div>${desc ? `<div class="toast__d">${esc(desc)}</div>` : ""}`;
    if (tone === "good") el.style.borderColor = "rgba(53,211,157,.45)";
    if (tone === "warn") el.style.borderColor = "rgba(255,204,102,.55)";
    if (tone === "bad") el.style.borderColor = "rgba(255,107,122,.45)";
    host.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateY(-4px)";
      el.style.transition = "all .18s ease";
      setTimeout(() => el.remove(), 220);
    }, 2400);
  };

  const modal = (() => {
    const host = $("#modalHost");
    const close = () => {
      host.classList.remove("is-open");
      host.setAttribute("aria-hidden", "true");
      host.innerHTML = "";
    };
    host.addEventListener("click", (e) => {
      if (e.target === host) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && host.classList.contains("is-open")) close();
    });
    const open = ({ title, body, foot, onReady }) => {
      host.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal__head">
            <div class="t">${esc(title)}</div>
            <button class="btn btn--ghost btn--small" data-modal-close>关闭</button>
          </div>
          <div class="modal__body">${body}</div>
          <div class="modal__foot">${foot ?? ""}</div>
        </div>
      `;
      host.classList.add("is-open");
      host.setAttribute("aria-hidden", "false");
      $$("[data-modal-close]", host).forEach((b) => b.addEventListener("click", close));
      onReady?.({ host, close });
    };
    return { open, close };
  })();

  const tag = (text, tone = "mono") => `<span class="tag tag--${tone}">${esc(text)}</span>`;
  const toneOf = (status) => {
    if (["已发布", "有效", "已通过", "已同意"].includes(status)) return "good";
    if (["待评审", "待审批", "进行中"].includes(status)) return "warn";
    if (["已驳回", "已下架", "无效"].includes(status)) return "bad";
    return "mono";
  };
  const parseTags = (raw) =>
    String(raw ?? "")
      .split(/[,\s]+/)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 20);

  const seed = () => {
    const users = [
      { id: "u_admin", name: "平台管理员-王", role: "平台管理员" },
      { id: "u_eng", name: "数据工程师-李", role: "数据工程师" },
      { id: "u_gov", name: "治理管理员-周", role: "治理管理员" },
      { id: "u_rev", name: "审核员-陈", role: "审核员" },
      { id: "u_biz", name: "业务用户-赵", role: "业务用户" },
    ];
    const spaces = [
      { id: "ly_ods", name: "ODS 层", type: "ODS", env: "生产", ownerId: "u_eng", desc: "原始数据落地层（贴源、轻加工）", createdAt: nowIso() },
      { id: "ly_dwd", name: "DWD 层", type: "DWD", env: "生产", ownerId: "u_eng", desc: "明细数据层（清洗、标准化、统一口径）", createdAt: nowIso() },
      { id: "ly_ads", name: "ADS 层", type: "ADS", env: "生产", ownerId: "u_gov", desc: "应用数据层（面向业务/报表/服务的汇总与指标）", createdAt: nowIso() },
    ];
    const datasources = [
      { id: "ds_mysql_ods", spaceId: "ly_ods", name: "订单业务库 MySQL（贴源）", type: "MySQL", host: "mysql-order.prod:3306", ownerId: "u_eng", desc: "用于抽取贴源数据进入 ODS", createdAt: nowIso() },
      { id: "ds_ck_dwd", spaceId: "ly_dwd", name: "ClickHouse（DWD）", type: "ClickHouse", host: "ck-dwd.prod:9000", ownerId: "u_eng", desc: "承载 DWD 明细表", createdAt: nowIso() },
      { id: "ds_ck_ads", spaceId: "ly_ads", name: "ClickHouse（ADS）", type: "ClickHouse", host: "ck-ads.prod:9000", ownerId: "u_gov", desc: "承载 ADS 汇总表/指标", createdAt: nowIso() },
    ];
    const tables = [
      { id: "tb_ods_order", spaceId: "ly_ods", datasourceId: "ds_mysql_ods", schema: "ods", name: "ods_trade_order", cnName: "订单贴源明细（ODS）", ownerId: "u_eng", tags: ["ODS", "交易"], status: "有效", desc: "从业务库抽取的贴源订单明细（轻加工）", createdAt: nowIso(), updatedAt: nowIso() },
      { id: "tb_dwd_order", spaceId: "ly_dwd", datasourceId: "ds_ck_dwd", schema: "dwd", name: "dwd_trade_order", cnName: "订单明细（DWD）", ownerId: "u_eng", tags: ["DWD", "交易"], status: "有效", desc: "清洗、标准化后的订单明细", createdAt: nowIso(), updatedAt: nowIso() },
      { id: "tb_ads_order_sum", spaceId: "ly_ads", datasourceId: "ds_ck_ads", schema: "ads", name: "ads_trade_order_summary", cnName: "订单汇总（ADS）", ownerId: "u_gov", tags: ["ADS", "指标"], status: "有效", desc: "面向看板的订单汇总与指标输出", createdAt: nowIso(), updatedAt: nowIso() },
    ];
    const standards = [
      { id: "std_order_id", spaceId: "ly_dwd", category: "字段", code: "STD-FIELD-ORDER-ID", name: "订单ID", scope: "订单域", dataType: "string", length: "32", format: "全局唯一ID", allowedValues: "", desc: "订单主键字段标准（DWD 口径）", status: "已发布", ownerId: "u_gov", reviewerId: "u_rev", version: 1, createdAt: nowIso(), updatedAt: nowIso(), publishedAt: nowIso() },
      { id: "std_status", spaceId: "ly_dwd", category: "码表", code: "STD-CODE-ORDER-STATUS", name: "订单状态码", scope: "订单域", dataType: "string", length: "16", format: "", allowedValues: "CREATED|PAID|CANCELLED|DONE", desc: "订单状态枚举（统一码值）", status: "草稿", ownerId: "u_gov", reviewerId: "u_rev", version: 1, createdAt: nowIso(), updatedAt: nowIso(), publishedAt: "" },
    ];
    const columns = [
      { id: "col_order_id", tableId: "tb_dwd_order", name: "order_id", cnName: "订单ID", type: "varchar(32)", nullable: false, pk: true, desc: "订单主键（统一口径）", standardId: "std_order_id" },
      { id: "col_status", tableId: "tb_dwd_order", name: "order_status", cnName: "订单状态", type: "varchar(16)", nullable: false, pk: false, desc: "订单状态码", standardId: "" },
      { id: "col_amount", tableId: "tb_dwd_order", name: "pay_amount", cnName: "支付金额", type: "decimal(18,2)", nullable: false, pk: false, desc: "支付金额", standardId: "" },
    ];
    const lineageEdges = [
      { id: "ln_1", spaceId: "ly_dwd", fromTableId: "tb_ods_order", toTableId: "tb_dwd_order", kind: "ETL", note: "ODS → DWD：清洗 + 标准化" },
      { id: "ln_2", spaceId: "ly_ads", fromTableId: "tb_dwd_order", toTableId: "tb_ads_order_sum", kind: "ETL", note: "DWD → ADS：汇总 + 指标加工" },
    ];
    const assets = [
      { id: "as_ads_order", spaceId: "ly_ads", type: "数据集", name: "订单汇总（ADS）", refTableId: "tb_ads_order_sum", visibility: "全平台", status: "已发布", ownerId: "u_gov", tags: ["ADS", "指标", "可复用"], desc: "用于经营看板/指标服务", createdAt: nowIso(), updatedAt: nowIso() },
    ];
    const accessRequests = [{ id: "req_1", assetId: "as_ads_order", spaceId: "ly_dwd", requesterId: "u_biz", reason: "画像需要订单汇总做消费分层标签", status: "待审批", approverId: "", decidedAt: "", comment: "", createdAt: nowIso() }];
    const standardReviews = [
      { id: uid("rev"), standardId: "std_order_id", action: "提交", byUserId: "u_gov", at: nowIso(), comment: "用于订单域统一主键口径" },
      { id: uid("rev"), standardId: "std_order_id", action: "通过", byUserId: "u_rev", at: nowIso(), comment: "同意，建议统一 varchar(32)" },
      { id: uid("rev"), standardId: "std_order_id", action: "发布", byUserId: "u_gov", at: nowIso(), comment: "已发布" },
    ];
    return {
      version: 2,
      activeSpaceId: "ly_dwd",
      activeUserId: "u_admin",
      users,
      spaces,
      datasources,
      tables,
      columns,
      lineageEdges,
      assets,
      accessRequests,
      standards,
      standardReviews,
    };
  };

  const store = (() => {
    const load = () => {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    };
    const save = (s) => localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    const ensure = () => {
      let s = load();
      if (!s || s.version !== 2) {
        s = seed();
        save(s);
      }
      if (!s.activeSpaceId || !s.spaces.some((x) => x.id === s.activeSpaceId)) s.activeSpaceId = s.spaces[0]?.id ?? null;
      if (!s.activeUserId || !s.users.some((x) => x.id === s.activeUserId)) s.activeUserId = s.users[0]?.id ?? null;
      save(s);
      return s;
    };
    const get = () => ensure();
    const set = (mut) => {
      const s = ensure();
      const next = mut(structuredClone(s)) ?? s;
      save(next);
      return next;
    };
    const reset = () => {
      const s = seed();
      save(s);
      return s;
    };
    const byId = (arr, id) => arr.find((x) => x.id === id) || null;
    return { get, set, reset, byId };
  })();

  const state = {
    meta: { selectedDsId: "", tableSearch: "" },
    plaza: { scope: "当前分层", search: "", reqFilter: "全部" },
  };

  const helpers = {
    activeSpace: (s) => store.byId(s.spaces, s.activeSpaceId),
    activeUser: (s) => store.byId(s.users, s.activeUserId),
    userName: (s, id) => store.byId(s.users, id)?.name ?? "-",
    spaceName: (s, id) => store.byId(s.spaces, id)?.name ?? "-",
    dsName: (s, id) => store.byId(s.datasources, id)?.name ?? "-",
    tableLabel: (s, id) => {
      const t = store.byId(s.tables, id);
      return t ? `${t.schema}.${t.name}` : "-";
    },
    canApprove: (u) => ["平台管理员", "审核员", "治理管理员"].includes(u?.role),
    canManageAny: (u) => u?.role === "平台管理员",
  };

  const ui = {
    setPage: (title, crumb = "") => {
      $("#pageTitle").textContent = title;
      $("#pageCrumb").textContent = crumb;
    },
    setNav: (route) => {
      $$("#nav .nav__item").forEach((a) => a.classList.toggle("is-active", a.dataset.route === route));
    },
    renderSelects: () => {
      const s = store.get();
      $("#spaceSelect").innerHTML = s.spaces.map((x) => `<option value="${esc(x.id)}">${esc(x.name)} · ${esc(x.type)} · ${esc(x.env)}</option>`).join("");
      $("#spaceSelect").value = s.activeSpaceId ?? "";
      $("#userSelect").innerHTML = s.users.map((u) => `<option value="${esc(u.id)}">${esc(u.name)} · ${esc(u.role)}</option>`).join("");
      $("#userSelect").value = s.activeUserId ?? "";
    },
  };

  const viewHost = $("#view");

  const confirmDelete = ({ title, detail, onYes }) => {
    modal.open({
      title,
      body: `<div class="muted">${esc(detail ?? "此操作不可撤销。")}</div>`,
      foot: `<button class="btn btn--ghost" data-modal-close>取消</button><button class="btn btn--danger" data-action="confirm.yes">确定删除</button>`,
      onReady: ({ host, close }) => {
        host.querySelector('[data-action="confirm.yes"]').addEventListener("click", () => {
          onYes?.();
          close();
        });
      },
    });
  };

  const routes = {
    "/spaces": () => {
      const s = store.get();
      ui.setPage("数据分层", "ODS / DWD / ADS：用于数仓分层与口径治理（切换分层查看对应对象）");
      ui.setNav("/spaces");
      const rows = s.spaces
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))
        .map(
          (x) => `
          <tr>
            <td>
              <div class="row" style="gap:8px">${x.id === s.activeSpaceId ? tag("当前", "good") : ""}<span style="font-weight:800">${esc(x.name)}</span></div>
              <div class="sub">负责人：${esc(helpers.userName(s, x.ownerId))} · 创建：${esc(fmtTime(x.createdAt))}</div>
            </td>
            <td>${tag(x.type, "mono")}</td>
            <td>${tag(x.env, "mono")}</td>
            <td>${esc(x.desc || "-")}</td>
            <td style="white-space:nowrap">
              <button class="btn btn--small" data-action="space.activate" data-id="${esc(x.id)}">切换</button>
              <button class="btn btn--small" data-action="space.edit" data-id="${esc(x.id)}">编辑</button>
              <button class="btn btn--small btn--danger" data-action="space.delete" data-id="${esc(x.id)}">删除</button>
            </td>
          </tr>
        `
        )
        .join("");
      const sp = helpers.activeSpace(s);
      const counts = sp
        ? {
            ds: s.datasources.filter((d) => d.spaceId === sp.id).length,
            tb: s.tables.filter((t) => t.spaceId === sp.id).length,
            as: s.assets.filter((a) => a.spaceId === sp.id).length,
            std: s.standards.filter((st) => st.spaceId === sp.id).length,
          }
        : { ds: 0, tb: 0, as: 0, std: 0 };
      viewHost.innerHTML = `
        <div class="grid">
          <div class="panel">
            <div class="panel__title"><h2>分层列表</h2><button class="btn btn--primary" data-action="space.create">新增分层</button></div>
            <div class="panel__body">
              <table class="table">
                <thead><tr><th style="width:240px">分层</th><th style="width:90px">层级</th><th style="width:90px">环境</th><th>说明</th><th style="width:220px">操作</th></tr></thead>
                <tbody>${rows || `<tr><td colspan="5"><div class="empty">暂无分层</div></td></tr>`}</tbody>
              </table>
            </div>
          </div>
          <div class="panel">
            <div class="panel__title"><h2>当前分层摘要</h2><div class="hint">${esc(sp?.name ?? "-")}</div></div>
            <div class="panel__body">
              <div class="row">
                <div class="pill"><span class="k">数据源</span><span class="v">${counts.ds}</span></div>
                <div class="pill"><span class="k">表</span><span class="v">${counts.tb}</span></div>
                <div class="pill"><span class="k">资产</span><span class="v">${counts.as}</span></div>
                <div class="pill"><span class="k">标准</span><span class="v">${counts.std}</span></div>
              </div>
              <div style="margin-top:10px" class="muted">说明：原型里“当前分层”会影响元数据、资产、标准列表范围。典型链路为 ODS → DWD → ADS，并可在血缘里维护层间依赖。</div>
            </div>
          </div>
        </div>
      `;
    },

    "/metadata": () => {
      const s = store.get();
      ui.setPage("元数据管理", "数据源 → 表 → 字段（绑定标准）+ 血缘（上游/下游）（按分层过滤）");
      ui.setNav("/metadata");
      const dsIn = s.datasources.filter((d) => d.spaceId === s.activeSpaceId);
      const tbIn = s.tables.filter((t) => t.spaceId === s.activeSpaceId);
      if (!state.meta.selectedDsId || !dsIn.some((d) => d.id === state.meta.selectedDsId)) state.meta.selectedDsId = dsIn[0]?.id ?? "";
      const selectedDsId = state.meta.selectedDsId;
      const dsRows = dsIn
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))
        .map(
          (d) => `
          <tr>
            <td>
              <div class="row" style="gap:8px">${d.id === selectedDsId ? tag("选中", "good") : ""}<span style="font-weight:800">${esc(d.name)}</span></div>
              <div class="sub">${tag(d.type, "mono")} · ${esc(d.host || "-")}</div>
            </td>
            <td>${esc(helpers.userName(s, d.ownerId))}</td>
            <td style="white-space:nowrap">
              <button class="btn btn--small" data-action="ds.select" data-id="${esc(d.id)}">查看</button>
              <button class="btn btn--small" data-action="ds.edit" data-id="${esc(d.id)}">编辑</button>
              <button class="btn btn--small btn--danger" data-action="ds.delete" data-id="${esc(d.id)}">删除</button>
            </td>
          </tr>
        `
        )
        .join("");
      const q = (state.meta.tableSearch ?? "").trim().toLowerCase();
      const tbRows = tbIn
        .filter((t) => (!selectedDsId ? true : t.datasourceId === selectedDsId))
        .filter((t) => {
          if (!q) return true;
          return (
            t.name.toLowerCase().includes(q) ||
            (t.cnName || "").toLowerCase().includes(q) ||
            (t.schema || "").toLowerCase().includes(q) ||
            (t.tags || []).some((x) => String(x).toLowerCase().includes(q))
          );
        })
        .slice()
        .sort((a, b) => (a.schema + "." + a.name).localeCompare(b.schema + "." + b.name, "zh-CN"))
        .map((t) => {
          const cols = s.columns.filter((c) => c.tableId === t.id).length;
          return `
          <tr>
            <td>
              <div style="font-weight:800">${esc(t.schema)}.${esc(t.name)} ${t.cnName ? `<span class="muted">· ${esc(t.cnName)}</span>` : ""}</div>
              <div class="sub">数据源：${esc(helpers.dsName(s, t.datasourceId))} · 字段：${cols} · 负责人：${esc(helpers.userName(s, t.ownerId))}</div>
              ${t.desc ? `<div class="sub">${esc(t.desc)}</div>` : ""}
            </td>
            <td>${(t.tags || []).slice(0, 4).map((x) => tag(x, "mono")).join(" ") || "-"}</td>
            <td>${tag(t.status || "有效", toneOf(t.status || "有效"))}</td>
            <td style="white-space:nowrap">
              <button class="btn btn--small" data-action="table.detail" data-id="${esc(t.id)}">字段/血缘</button>
              <button class="btn btn--small" data-action="table.edit" data-id="${esc(t.id)}">编辑</button>
              <button class="btn btn--small btn--danger" data-action="table.delete" data-id="${esc(t.id)}">删除</button>
            </td>
          </tr>
        `;
        })
        .join("");
      viewHost.innerHTML = `
        <div class="split">
          <div class="panel">
            <div class="panel__title"><h2>数据源（当前分层）</h2><button class="btn btn--primary" data-action="ds.create">新增数据源</button></div>
            <div class="panel__body">
              <table class="table">
                <thead><tr><th>数据源</th><th style="width:120px">负责人</th><th style="width:200px">操作</th></tr></thead>
                <tbody>${dsRows || `<tr><td colspan="3"><div class="empty">暂无数据源。先新增数据源再纳管表。</div></td></tr>`}</tbody>
              </table>
            </div>
          </div>
          <div class="panel">
            <div class="panel__title">
              <h2>表（元数据）</h2>
              <div class="row">
                <input class="input" style="width:240px" value="${esc(state.meta.tableSearch ?? "")}" placeholder="搜索 schema/表名/中文名/标签" data-action="meta.search" />
                <button class="btn btn--primary" data-action="table.create">新增表</button>
              </div>
            </div>
            <div class="panel__body">
              <table class="table">
                <thead><tr><th>表</th><th style="width:190px">标签</th><th style="width:90px">状态</th><th style="width:260px">操作</th></tr></thead>
                <tbody>${tbRows || `<tr><td colspan="4"><div class="empty">暂无表。点击“新增表”创建，并在“字段/血缘”维护字段与血缘。</div></td></tr>`}</tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    "/plaza": () => {
      const s = store.get();
      const me = helpers.activeUser(s);
      ui.setPage("数据资产广场", "发布资产 → 搜索发现 → 申请权限 → 审批通过/驳回");
      ui.setNav("/plaza");
      const scope = state.plaza.scope ?? "当前分层";
      const q = (state.plaza.search ?? "").trim().toLowerCase();
      const assets = s.assets
        .filter((a) => (scope === "当前分层" ? a.spaceId === s.activeSpaceId : scope === "全平台" ? a.visibility === "全平台" : true))
        .filter((a) => (!q ? true : a.name.toLowerCase().includes(q) || (a.desc || "").toLowerCase().includes(q) || (a.tags || []).some((t) => String(t).toLowerCase().includes(q))))
        .slice()
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      const assetRows = assets
        .map((a) => {
          const t = a.refTableId ? store.byId(s.tables, a.refTableId) : null;
          const canEdit = helpers.canManageAny(me) || a.ownerId === me?.id;
          return `
            <tr>
              <td>
                <div class="row" style="gap:8px">${tag(a.type, "mono")}<span style="font-weight:800">${esc(a.name)}</span>${tag(a.status, toneOf(a.status))}</div>
                <div class="sub">分层：${esc(helpers.spaceName(s, a.spaceId))} · 可见：${esc(a.visibility)} · 负责人：${esc(helpers.userName(s, a.ownerId))} · 更新：${esc(fmtTime(a.updatedAt))}</div>
                ${t ? `<div class="sub">引用表：${tag(`${t.schema}.${t.name}`, "mono")} ${t.cnName ? `<span class="muted">· ${esc(t.cnName)}</span>` : ""}</div>` : ""}
                ${a.desc ? `<div class="sub">${esc(a.desc)}</div>` : ""}
              </td>
              <td>${(a.tags || []).slice(0, 6).map((x) => tag(x, "mono")).join(" ") || "-"}</td>
              <td style="white-space:nowrap">
                <button class="btn btn--small" data-action="asset.request" data-id="${esc(a.id)}">申请权限</button>
                ${canEdit ? `<button class="btn btn--small" data-action="asset.edit" data-id="${esc(a.id)}">编辑</button>` : ""}
                ${canEdit ? `<button class="btn btn--small" data-action="asset.toggle" data-id="${esc(a.id)}">${a.status === "已发布" ? "下架" : "发布"}</button>` : ""}
                ${canEdit ? `<button class="btn btn--small btn--danger" data-action="asset.delete" data-id="${esc(a.id)}">删除</button>` : ""}
              </td>
            </tr>
          `;
        })
        .join("");

      const reqFilter = state.plaza.reqFilter ?? "全部";
      const reqs = s.accessRequests
        .filter((r) => (reqFilter === "我发起" ? r.requesterId === me?.id : true))
        .filter((r) => (reqFilter === "待我审批" ? r.status === "待审批" : true))
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const reqRows = reqs
        .map((r) => {
          const a = store.byId(s.assets, r.assetId);
          const canDecide = (helpers.canApprove(me) || a?.ownerId === me?.id) && r.status === "待审批";
          return `
            <tr>
              <td>
                <div style="font-weight:800">${esc(a?.name ?? "-")}</div>
                <div class="sub">发起人：${esc(helpers.userName(s, r.requesterId))} · 发起分层：${esc(helpers.spaceName(s, r.spaceId))} · 时间：${esc(fmtTime(r.createdAt))}</div>
                <div class="sub">理由：${esc(r.reason || "-")}</div>
              </td>
              <td>${tag(r.status, toneOf(r.status))}</td>
              <td>${esc(r.approverId ? helpers.userName(s, r.approverId) : "-")}</td>
              <td style="white-space:nowrap">
                <button class="btn btn--small" data-action="req.view" data-id="${esc(r.id)}">查看</button>
                ${canDecide ? `<button class="btn btn--small" data-action="req.approve" data-id="${esc(r.id)}">通过</button><button class="btn btn--small btn--danger" data-action="req.reject" data-id="${esc(r.id)}">驳回</button>` : ""}
              </td>
            </tr>
          `;
        })
        .join("");

      viewHost.innerHTML = `
        <div class="grid">
          <div class="panel">
            <div class="panel__title">
              <h2>资产列表</h2>
              <div class="row">
                <div class="select" style="min-width:160px">
                  <label class="select__label">范围</label>
                  <select data-action="plaza.scope">
                    <option value="当前分层" ${scope === "当前分层" ? "selected" : ""}>当前分层</option>
                    <option value="全平台" ${scope === "全平台" ? "selected" : ""}>全平台</option>
                    <option value="全部" ${scope === "全部" ? "selected" : ""}>全部（演示）</option>
                  </select>
                </div>
                <input class="input" style="width:260px" value="${esc(state.plaza.search ?? "")}" placeholder="搜索资产名/描述/标签" data-action="plaza.search" />
                <button class="btn btn--primary" data-action="asset.create">新增资产</button>
              </div>
            </div>
            <div class="panel__body">
              <table class="table">
                <thead><tr><th>资产</th><th style="width:220px">标签</th><th style="width:300px">操作</th></tr></thead>
                <tbody>${assetRows || `<tr><td colspan="3"><div class="empty">暂无资产。</div></td></tr>`}</tbody>
              </table>
            </div>
          </div>

          <div class="panel">
            <div class="panel__title">
              <h2>权限申请 / 审批</h2>
              <div class="row">
                <div class="select" style="min-width:160px">
                  <label class="select__label">过滤</label>
                  <select data-action="plaza.reqFilter">
                    <option value="全部" ${reqFilter === "全部" ? "selected" : ""}>全部</option>
                    <option value="我发起" ${reqFilter === "我发起" ? "selected" : ""}>我发起</option>
                    <option value="待我审批" ${reqFilter === "待我审批" ? "selected" : ""}>待我审批</option>
                  </select>
                </div>
                <div class="hint">当前用户：${esc(me?.name ?? "-")}（${esc(me?.role ?? "-")}）${helpers.canApprove(me) ? " · " + tag("可审批", "good") : " · " + tag("仅申请", "warn")}</div>
              </div>
            </div>
            <div class="panel__body">
              <table class="table">
                <thead><tr><th>申请单</th><th style="width:90px">状态</th><th style="width:120px">审批人</th><th style="width:260px">操作</th></tr></thead>
                <tbody>${reqRows || `<tr><td colspan="4"><div class="empty">暂无申请记录。</div></td></tr>`}</tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    "/standards": () => {
      const s = store.get();
      const me = helpers.activeUser(s);
      ui.setPage("数据标准评审", "草稿 → 提交评审 → 退回/驳回/通过 → 发布（产生审计轨迹）（按分层过滤）");
      ui.setNav("/standards");
      const list = s.standards.filter((x) => x.spaceId === s.activeSpaceId).slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      const queue = list.filter((x) => x.status === "待评审");
      const rows = list
        .map((x) => {
          const canEdit = helpers.canManageAny(me) || x.ownerId === me?.id;
          const canSubmit = canEdit && ["草稿", "已退回"].includes(x.status);
          const canDelete = canEdit && ["草稿", "已退回", "已驳回"].includes(x.status);
          return `
            <tr>
              <td>
                <div class="row" style="gap:8px">${tag(x.category, "mono")}<span style="font-weight:800">${esc(x.name)}</span>${tag(x.status, toneOf(x.status))}${tag(`v${x.version}`, "mono")}</div>
                <div class="sub">编码：${tag(x.code || "-", "mono")} · 负责人：${esc(helpers.userName(s, x.ownerId))} · 评审人：${esc(x.reviewerId ? helpers.userName(s, x.reviewerId) : "-")}</div>
                <div class="sub">范围：${esc(x.scope || "-")} · 类型：${esc(x.dataType || "-")} · 长度：${esc(x.length || "-")}</div>
                ${x.allowedValues ? `<div class="sub">码值：${esc(x.allowedValues)}</div>` : ""}
              </td>
              <td style="white-space:nowrap">
                <button class="btn btn--small" data-action="std.timeline" data-id="${esc(x.id)}">流程</button>
                ${canEdit ? `<button class="btn btn--small" data-action="std.edit" data-id="${esc(x.id)}">编辑</button>` : ""}
                ${canSubmit ? `<button class="btn btn--small" data-action="std.submit" data-id="${esc(x.id)}">提交评审</button>` : ""}
                ${canDelete ? `<button class="btn btn--small btn--danger" data-action="std.delete" data-id="${esc(x.id)}">删除</button>` : ""}
              </td>
            </tr>
          `;
        })
        .join("");
      const qRows = queue
        .map((x) => {
          const canReview = helpers.canApprove(me);
          return `
            <tr>
              <td>
                <div class="row" style="gap:8px">${tag(x.category, "mono")}<span style="font-weight:800">${esc(x.name)}</span>${tag("待评审", "warn")}</div>
                <div class="sub">负责人：${esc(helpers.userName(s, x.ownerId))} · 评审人：${esc(x.reviewerId ? helpers.userName(s, x.reviewerId) : "-")}</div>
              </td>
              <td style="white-space:nowrap">
                <button class="btn btn--small" data-action="std.timeline" data-id="${esc(x.id)}">查看流程</button>
                ${canReview ? `<button class="btn btn--small" data-action="std.review" data-id="${esc(x.id)}">进入评审</button>` : ""}
              </td>
            </tr>
          `;
        })
        .join("");
      viewHost.innerHTML = `
        <div class="split">
          <div class="panel">
            <div class="panel__title"><h2>标准列表（当前分层）</h2><button class="btn btn--primary" data-action="std.create">新增标准</button></div>
            <div class="panel__body">
              <table class="table">
                <thead><tr><th>标准</th><th style="width:300px">操作</th></tr></thead>
                <tbody>${rows || `<tr><td colspan="2"><div class="empty">暂无标准。</div></td></tr>`}</tbody>
              </table>
            </div>
          </div>
          <div class="panel">
            <div class="panel__title"><h2>待评审队列</h2><div class="hint">当前用户：${esc(me?.name ?? "-")}（${esc(me?.role ?? "-")}）</div></div>
            <div class="panel__body">
              <table class="table">
                <thead><tr><th>待评审项</th><th style="width:220px">操作</th></tr></thead>
                <tbody>${qRows || `<tr><td colspan="2"><div class="empty">暂无待评审标准。</div></td></tr>`}</tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },
  };

  const router = {
    route: () => (location.hash || "#/spaces").replace(/^#/, ""),
    render: () => {
      const path = router.route();
      (routes[path] || routes["/spaces"])();
    },
  };

  // ---------- Forms / Details ----------
  const openSpaceForm = (mode, id) => {
    const s = store.get();
    const x = id ? store.byId(s.spaces, id) : null;
    modal.open({
      title: mode === "create" ? "新增分层" : `编辑分层：${x?.name ?? ""}`,
      body: `
        <div class="form">
          <div class="field field--6"><div class="label">分层名称</div><input class="input" name="name" value="${esc(x?.name ?? "")}" placeholder="例如：ODS 层 / DWD 层 / ADS 层" /></div>
          <div class="field field--3"><div class="label">层级</div>
            <select name="type">${["ODS", "DWD", "DWS", "ADS", "DIM"].map((t) => `<option value="${esc(t)}" ${x?.type === t ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>
          </div>
          <div class="field field--3"><div class="label">环境</div>
            <select name="env">${["生产", "预发", "测试", "开发"].map((t) => `<option value="${esc(t)}" ${x?.env === t ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>
          </div>
          <div class="field field--6"><div class="label">负责人</div>
            <select name="ownerId">${s.users.map((u) => `<option value="${esc(u.id)}" ${x?.ownerId === u.id ? "selected" : ""}>${esc(u.name)} · ${esc(u.role)}</option>`).join("")}</select>
          </div>
          <div class="field field--12"><div class="label">说明</div><textarea name="desc">${esc(x?.desc ?? "")}</textarea></div>
        </div>
      `,
      foot: `<button class="btn btn--ghost" data-modal-close>取消</button><button class="btn btn--primary" data-action="space.save">${mode === "create" ? "创建" : "保存"}</button>`,
      onReady: ({ host, close }) => {
        host.querySelector('[data-action="space.save"]').addEventListener("click", () => {
          const name = host.querySelector('[name="name"]').value.trim();
          if (!name) return toast("分层名称不能为空", "请填写后保存。", "warn");
          const type = host.querySelector('[name="type"]').value;
          const env = host.querySelector('[name="env"]').value;
          const ownerId = host.querySelector('[name="ownerId"]').value;
          const desc = host.querySelector('[name="desc"]').value.trim();
          store.set((s2) => {
            if (mode === "create") {
              const nid = uid("sp");
              s2.spaces.push({ id: nid, name, type, env, ownerId, desc, createdAt: nowIso() });
              s2.activeSpaceId = nid;
            } else if (x) {
              const idx = s2.spaces.findIndex((z) => z.id === x.id);
              if (idx >= 0) s2.spaces[idx] = { ...s2.spaces[idx], name, type, env, ownerId, desc };
            }
            return s2;
          });
          close();
          ui.renderSelects();
          toast("分层已保存", name, "good");
          router.render();
        });
      },
    });
  };

  const openDsForm = (mode, id) => {
    const s = store.get();
    const x = id ? store.byId(s.datasources, id) : null;
    modal.open({
      title: mode === "create" ? "新增数据源" : `编辑数据源：${x?.name ?? ""}`,
      body: `
        <div class="form">
          <div class="field field--6"><div class="label">数据源名称</div><input class="input" name="name" value="${esc(x?.name ?? "")}" /></div>
          <div class="field field--3"><div class="label">类型</div>
            <select name="type">${["MySQL", "PostgreSQL", "Oracle", "SQLServer", "ClickHouse", "Hive", "MongoDB", "Kafka", "HBase", "DM", "OceanBase"].map((t) => `<option value="${esc(t)}" ${x?.type === t ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>
          </div>
          <div class="field field--3"><div class="label">连接（示例）</div><input class="input" name="host" value="${esc(x?.host ?? "")}" placeholder="host:port 或 jdbc..." /></div>
          <div class="field field--6"><div class="label">负责人</div>
            <select name="ownerId">${s.users.map((u) => `<option value="${esc(u.id)}" ${x?.ownerId === u.id ? "selected" : ""}>${esc(u.name)} · ${esc(u.role)}</option>`).join("")}</select>
          </div>
          <div class="field field--12"><div class="label">说明</div><textarea name="desc">${esc(x?.desc ?? "")}</textarea></div>
        </div>
      `,
      foot: `<button class="btn btn--ghost" data-modal-close>取消</button><button class="btn btn--primary" data-action="ds.save">${mode === "create" ? "创建" : "保存"}</button>`,
      onReady: ({ host, close }) => {
        host.querySelector('[data-action="ds.save"]').addEventListener("click", () => {
          const name = host.querySelector('[name="name"]').value.trim();
          if (!name) return toast("数据源名称不能为空", "请填写后保存。", "warn");
          const type = host.querySelector('[name="type"]').value;
          const hostStr = host.querySelector('[name="host"]').value.trim();
          const ownerId = host.querySelector('[name="ownerId"]').value;
          const desc = host.querySelector('[name="desc"]').value.trim();
          store.set((s2) => {
            if (mode === "create") {
              const nid = uid("ds");
              s2.datasources.push({ id: nid, spaceId: s2.activeSpaceId, name, type, host: hostStr, ownerId, desc, createdAt: nowIso() });
              state.meta.selectedDsId = nid;
            } else if (x) {
              const idx = s2.datasources.findIndex((z) => z.id === x.id);
              if (idx >= 0) s2.datasources[idx] = { ...s2.datasources[idx], name, type, host: hostStr, ownerId, desc };
            }
            return s2;
          });
          close();
          toast("数据源已保存", name, "good");
          router.render();
        });
      },
    });
  };

  const openTableForm = (mode, id) => {
    const s = store.get();
    const x = id ? store.byId(s.tables, id) : null;
    const dsIn = s.datasources.filter((d) => d.spaceId === s.activeSpaceId);
    if (!dsIn.length) return toast("请先新增数据源", "当前分层无数据源，无法新增表。", "warn");
    modal.open({
      title: mode === "create" ? "新增表（元数据）" : `编辑表：${x?.schema ?? ""}.${x?.name ?? ""}`,
      body: `
        <div class="form">
          <div class="field field--6"><div class="label">数据源</div>
            <select name="datasourceId">${dsIn.map((d) => `<option value="${esc(d.id)}" ${(x?.datasourceId === d.id) || (!x && state.meta.selectedDsId === d.id) ? "selected" : ""}>${esc(d.name)} · ${esc(d.type)}</option>`).join("")}</select>
          </div>
          <div class="field field--3"><div class="label">Schema</div><input class="input" name="schema" value="${esc(x?.schema ?? "public")}" /></div>
          <div class="field field--3"><div class="label">表名</div><input class="input" name="name" value="${esc(x?.name ?? "")}" placeholder="例如：t_order" /></div>
          <div class="field field--6"><div class="label">中文名（可选）</div><input class="input" name="cnName" value="${esc(x?.cnName ?? "")}" /></div>
          <div class="field field--6"><div class="label">负责人</div>
            <select name="ownerId">${s.users.map((u) => `<option value="${esc(u.id)}" ${x?.ownerId === u.id ? "selected" : ""}>${esc(u.name)} · ${esc(u.role)}</option>`).join("")}</select>
          </div>
          <div class="field field--6"><div class="label">标签（逗号/空格分隔）</div><input class="input" name="tags" value="${esc((x?.tags ?? []).join(", "))}" /></div>
          <div class="field field--3"><div class="label">状态</div><select name="status">${["有效", "弃用", "下线"].map((t) => `<option value="${esc(t)}" ${x?.status === t ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></div>
          <div class="field field--12"><div class="label">描述</div><textarea name="desc">${esc(x?.desc ?? "")}</textarea></div>
        </div>
      `,
      foot: `<button class="btn btn--ghost" data-modal-close>取消</button><button class="btn btn--primary" data-action="table.save">${mode === "create" ? "创建" : "保存"}</button>`,
      onReady: ({ host, close }) => {
        host.querySelector('[data-action="table.save"]').addEventListener("click", () => {
          const datasourceId = host.querySelector('[name="datasourceId"]').value;
          const schema = host.querySelector('[name="schema"]').value.trim() || "public";
          const name = host.querySelector('[name="name"]').value.trim();
          if (!name) return toast("表名不能为空", "请填写后保存。", "warn");
          const cnName = host.querySelector('[name="cnName"]').value.trim();
          const ownerId = host.querySelector('[name="ownerId"]').value;
          const tags = parseTags(host.querySelector('[name="tags"]').value);
          const status = host.querySelector('[name="status"]').value;
          const desc = host.querySelector('[name="desc"]').value.trim();
          store.set((s2) => {
            if (mode === "create") {
              s2.tables.push({ id: uid("tb"), spaceId: s2.activeSpaceId, datasourceId, schema, name, cnName, ownerId, tags, status, desc, createdAt: nowIso(), updatedAt: nowIso() });
            } else if (x) {
              const idx = s2.tables.findIndex((z) => z.id === x.id);
              if (idx >= 0) s2.tables[idx] = { ...s2.tables[idx], datasourceId, schema, name, cnName, ownerId, tags, status, desc, updatedAt: nowIso() };
            }
            return s2;
          });
          close();
          toast("表已保存", `${schema}.${name}`, "good");
          router.render();
        });
      },
    });
  };

  const openTableDetail = (tableId) => {
    const s = store.get();
    const t = store.byId(s.tables, tableId);
    if (!t) return;
    const ds = store.byId(s.datasources, t.datasourceId);
    const cols = s.columns.filter((c) => c.tableId === t.id);
    const publishedFieldStd = s.standards.filter((st) => st.spaceId === s.activeSpaceId && st.category === "字段" && st.status === "已发布");
    const up = s.lineageEdges.filter((e) => e.toTableId === t.id);
    const down = s.lineageEdges.filter((e) => e.fromTableId === t.id);
    const others = s.tables.filter((x) => x.spaceId === s.activeSpaceId && x.id !== t.id);
    const colRows = cols
      .map((c) => {
        const std = c.standardId ? store.byId(s.standards, c.standardId) : null;
        return `
          <tr>
            <td><div style="font-weight:800">${esc(c.name)} ${c.cnName ? `<span class="muted">· ${esc(c.cnName)}</span>` : ""}</div><div class="sub">${tag(c.type, "mono")} ${c.pk ? tag("PK", "good") : ""} ${c.nullable ? tag("NULL", "warn") : tag("NOT NULL", "mono")}</div>${c.desc ? `<div class="sub">${esc(c.desc)}</div>` : ""}</td>
            <td>${std ? `${tag(std.code || "-", "mono")}<div class="sub">${esc(std.name)}</div>` : "-"}</td>
            <td style="white-space:nowrap"><button class="btn btn--small" data-action="col.edit" data-id="${esc(c.id)}">编辑</button> <button class="btn btn--small btn--danger" data-action="col.delete" data-id="${esc(c.id)}">删除</button></td>
          </tr>
        `;
      })
      .join("");
    const edgeRows = (arr, labelFn) =>
      arr
        .map((e) => `<tr><td>${tag(e.kind, "mono")} ${tag(labelFn(e), "mono")}</td><td>${esc(e.note || "-")}</td><td style="white-space:nowrap"><button class="btn btn--small btn--danger" data-action="lineage.delete" data-id="${esc(e.id)}">删除</button></td></tr>`)
        .join("");

    modal.open({
      title: `表详情：${t.schema}.${t.name}`,
      body: `
        <div class="grid">
          <div class="panel" style="padding:12px">
            <div class="panel__title"><h2>基本信息</h2><button class="btn btn--small" data-action="table.publish" data-id="${esc(t.id)}">发布为资产</button></div>
            <div class="panel__body">
              <div class="row" style="gap:8px">${tag(ds?.type ?? "-", "mono")}${tag(ds?.name ?? "-", "mono")}${tag(t.status || "有效", toneOf(t.status || "有效"))}${(t.tags || []).slice(0, 6).map((x) => tag(x, "mono")).join(" ")}</div>
              <div class="muted" style="margin-top:8px">负责人：${esc(helpers.userName(s, t.ownerId))} · 更新：${esc(fmtTime(t.updatedAt))}</div>
              ${t.desc ? `<div style="margin-top:8px">${esc(t.desc)}</div>` : `<div style="margin-top:8px" class="muted">暂无描述</div>`}
            </div>
          </div>

          <div class="panel" style="padding:12px">
            <div class="panel__title"><h2>字段（绑定已发布字段标准）</h2><button class="btn btn--small btn--primary" data-action="col.create" data-id="${esc(t.id)}">新增字段</button></div>
            <div class="panel__body">
              <table class="table">
                <thead><tr><th>字段</th><th style="width:220px">标准</th><th style="width:200px">操作</th></tr></thead>
                <tbody>${colRows || `<tr><td colspan="3"><div class="empty">暂无字段</div></td></tr>`}</tbody>
              </table>
            </div>
          </div>

          <div class="panel" style="padding:12px">
            <div class="panel__title"><h2>血缘</h2><button class="btn btn--small" data-action="lineage.add" data-id="${esc(t.id)}">新增上游</button></div>
            <div class="panel__body">
              <div class="muted" style="margin-bottom:8px">上游</div>
              <table class="table">
                <thead><tr><th>来源</th><th style="width:220px">说明</th><th style="width:120px">操作</th></tr></thead>
                <tbody>${edgeRows(up, (e) => helpers.tableLabel(s, e.fromTableId)) || `<tr><td colspan="3"><div class="empty">暂无上游</div></td></tr>`}</tbody>
              </table>
              <div class="muted" style="margin:12px 0 8px">下游</div>
              <table class="table">
                <thead><tr><th>去向</th><th style="width:220px">说明</th><th style="width:120px">操作</th></tr></thead>
                <tbody>${edgeRows(down, (e) => helpers.tableLabel(s, e.toTableId)) || `<tr><td colspan="3"><div class="empty">暂无下游</div></td></tr>`}</tbody>
              </table>
            </div>
          </div>
        </div>
      `,
      foot: `<button class="btn btn--ghost" data-modal-close>关闭</button>`,
      onReady: ({ host, close }) => {
        const openColForm = (mode, colId) => {
          const s2 = store.get();
          const col = colId ? store.byId(s2.columns, colId) : null;
          modal.open({
            title: mode === "create" ? "新增字段" : `编辑字段：${col?.name ?? ""}`,
            body: `
              <div class="form">
                <div class="field field--4"><div class="label">字段名</div><input class="input" name="name" value="${esc(col?.name ?? "")}" /></div>
                <div class="field field--4"><div class="label">中文名</div><input class="input" name="cnName" value="${esc(col?.cnName ?? "")}" /></div>
                <div class="field field--4"><div class="label">类型</div><input class="input" name="type" value="${esc(col?.type ?? "varchar(64)")}" /></div>
                <div class="field field--3"><div class="label">可为空</div><select name="nullable"><option value="false" ${col?.nullable === false ? "selected" : ""}>否</option><option value="true" ${col?.nullable === true ? "selected" : ""}>是</option></select></div>
                <div class="field field--3"><div class="label">主键</div><select name="pk"><option value="false" ${col?.pk ? "" : "selected"}>否</option><option value="true" ${col?.pk ? "selected" : ""}>是</option></select></div>
                <div class="field field--6"><div class="label">绑定标准（已发布字段标准）</div>
                  <select name="standardId">
                    <option value="">不绑定</option>
                    ${publishedFieldStd.map((st) => `<option value="${esc(st.id)}" ${col?.standardId === st.id ? "selected" : ""}>${esc(st.name)} · ${esc(st.code || "")}</option>`).join("")}
                  </select>
                </div>
                <div class="field field--12"><div class="label">描述</div><textarea name="desc">${esc(col?.desc ?? "")}</textarea></div>
              </div>
            `,
            foot: `<button class="btn btn--ghost" data-modal-close>取消</button><button class="btn btn--primary" data-action="col.save">${mode === "create" ? "创建" : "保存"}</button>`,
            onReady: ({ host: h2, close: c2 }) => {
              h2.querySelector('[data-action="col.save"]').addEventListener("click", () => {
                const name = h2.querySelector('[name="name"]').value.trim();
                if (!name) return toast("字段名不能为空", "", "warn");
                const cnName = h2.querySelector('[name="cnName"]').value.trim();
                const type = h2.querySelector('[name="type"]').value.trim() || "varchar(64)";
                const nullable = h2.querySelector('[name="nullable"]').value === "true";
                const pk = h2.querySelector('[name="pk"]').value === "true";
                const standardId = h2.querySelector('[name="standardId"]').value || "";
                const desc = h2.querySelector('[name="desc"]').value.trim();
                store.set((s3) => {
                  if (mode === "create") s3.columns.push({ id: uid("col"), tableId: t.id, name, cnName, type, nullable, pk, desc, standardId });
                  else if (col) {
                    const idx = s3.columns.findIndex((z) => z.id === col.id);
                    if (idx >= 0) s3.columns[idx] = { ...s3.columns[idx], name, cnName, type, nullable, pk, desc, standardId };
                  }
                  const tidx = s3.tables.findIndex((z) => z.id === t.id);
                  if (tidx >= 0) s3.tables[tidx].updatedAt = nowIso();
                  return s3;
                });
                c2();
                toast("字段已保存", name, "good");
                openTableDetail(t.id);
              });
            },
          });
        };

        host.addEventListener("click", (e) => {
          const btn = e.target.closest("button[data-action]");
          if (!btn) return;
          const act = btn.dataset.action;
          const id = btn.dataset.id;
          if (act === "col.create") return openColForm("create");
          if (act === "col.edit") return openColForm("edit", id);
          if (act === "col.delete")
            return confirmDelete({
              title: "删除字段",
              detail: "删除后不可恢复。",
              onYes: () => {
                store.set((s4) => {
                  s4.columns = s4.columns.filter((c) => c.id !== id);
                  const tidx = s4.tables.findIndex((z) => z.id === t.id);
                  if (tidx >= 0) s4.tables[tidx].updatedAt = nowIso();
                  return s4;
                });
                toast("字段已删除", "", "good");
                openTableDetail(t.id);
              },
            });
          if (act === "lineage.add") {
            if (!others.length) return toast("暂无可选上游表", "当前分层表数量不足。", "warn");
            modal.open({
              title: "新增上游血缘",
              body: `
                <div class="form">
                  <div class="field field--12"><div class="label">上游表</div>
                    <select name="fromTableId">${others.map((x) => `<option value="${esc(x.id)}">${esc(x.schema)}.${esc(x.name)}${x.cnName ? ` · ${esc(x.cnName)}` : ""}</option>`).join("")}</select>
                  </div>
                  <div class="field field--4"><div class="label">类型</div><select name="kind"><option value="ETL">ETL</option><option value="CDC">CDC</option></select></div>
                  <div class="field field--8"><div class="label">说明</div><input class="input" name="note" placeholder="例如：抽取+清洗 / 实时增量…" /></div>
                </div>
              `,
              foot: `<button class="btn btn--ghost" data-modal-close>取消</button><button class="btn btn--primary" data-action="lineage.save">创建</button>`,
              onReady: ({ host: h2, close: c2 }) => {
                h2.querySelector('[data-action="lineage.save"]').addEventListener("click", () => {
                  const fromTableId = h2.querySelector('[name="fromTableId"]').value;
                  const kind = h2.querySelector('[name="kind"]').value;
                  const note = h2.querySelector('[name="note"]').value.trim();
                  store.set((s5) => {
                    const exists = s5.lineageEdges.some((e) => e.fromTableId === fromTableId && e.toTableId === t.id);
                    if (!exists) s5.lineageEdges.push({ id: uid("ln"), spaceId: s5.activeSpaceId, fromTableId, toTableId: t.id, kind, note });
                    return s5;
                  });
                  c2();
                  toast("血缘已创建", "", "good");
                  openTableDetail(t.id);
                });
              },
            });
          }
          if (act === "lineage.delete")
            return confirmDelete({
              title: "删除血缘",
              detail: "删除后将移除依赖关系。",
              onYes: () => {
                store.set((s6) => {
                  s6.lineageEdges = s6.lineageEdges.filter((x) => x.id !== id);
                  return s6;
                });
                toast("血缘已删除", "", "good");
                openTableDetail(t.id);
              },
            });
          if (act === "table.publish") {
            store.set((s7) => {
              const exists = s7.assets.some((a) => a.refTableId === t.id && a.type === "数据集");
              if (!exists) {
                s7.assets.push({
                  id: uid("as"),
                  spaceId: s7.activeSpaceId,
                  type: "数据集",
                  name: t.cnName ? `${t.cnName}（数据集）` : `${t.schema}.${t.name}（数据集）`,
                  refTableId: t.id,
                  visibility: "当前分层",
                  status: "已发布",
                  ownerId: t.ownerId,
                  tags: (t.tags || []).slice(0, 10),
                  desc: t.desc || "",
                  createdAt: nowIso(),
                  updatedAt: nowIso(),
                });
              }
              return s7;
            });
            toast("已发布为资产", "已在资产广场可见。", "good");
            close();
            location.hash = "#/plaza";
          }
        });
      },
    });
  };

  const openAssetForm = (mode, id) => {
    const s = store.get();
    const me = helpers.activeUser(s);
    const x = id ? store.byId(s.assets, id) : null;
    const tablesIn = s.tables.filter((t) => t.spaceId === s.activeSpaceId);
    modal.open({
      title: mode === "create" ? "新增资产" : `编辑资产：${x?.name ?? ""}`,
      body: `
        <div class="form">
          <div class="field field--4"><div class="label">类型</div><select name="type">${["数据集", "指标", "API"].map((t) => `<option value="${esc(t)}" ${x?.type === t ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></div>
          <div class="field field--8"><div class="label">名称</div><input class="input" name="name" value="${esc(x?.name ?? "")}" /></div>
          <div class="field field--6"><div class="label">引用表（可选）</div>
            <select name="refTableId"><option value="">不引用</option>${tablesIn.map((t) => `<option value="${esc(t.id)}" ${x?.refTableId === t.id ? "selected" : ""}>${esc(t.schema)}.${esc(t.name)}${t.cnName ? ` · ${esc(t.cnName)}` : ""}</option>`).join("")}</select>
          </div>
          <div class="field field--3"><div class="label">可见</div><select name="visibility">${["当前分层", "全平台"].map((v) => `<option value="${esc(v)}" ${x?.visibility === v ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></div>
          <div class="field field--3"><div class="label">状态</div><select name="status">${["草稿", "已发布", "已下架"].map((v) => `<option value="${esc(v)}" ${x?.status === v ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></div>
          <div class="field field--6"><div class="label">负责人</div>
            <select name="ownerId">${s.users.map((u) => `<option value="${esc(u.id)}" ${x?.ownerId === u.id || (!x && u.id === me?.id) ? "selected" : ""}>${esc(u.name)} · ${esc(u.role)}</option>`).join("")}</select>
          </div>
          <div class="field field--6"><div class="label">标签</div><input class="input" name="tags" value="${esc((x?.tags ?? []).join(", "))}" /></div>
          <div class="field field--12"><div class="label">描述</div><textarea name="desc">${esc(x?.desc ?? "")}</textarea></div>
        </div>
      `,
      foot: `<button class="btn btn--ghost" data-modal-close>取消</button><button class="btn btn--primary" data-action="asset.save">${mode === "create" ? "创建" : "保存"}</button>`,
      onReady: ({ host, close }) => {
        host.querySelector('[data-action="asset.save"]').addEventListener("click", () => {
          const type = host.querySelector('[name="type"]').value;
          const name = host.querySelector('[name="name"]').value.trim();
          if (!name) return toast("资产名称不能为空", "", "warn");
          const refTableId = host.querySelector('[name="refTableId"]').value || "";
          const visibility = host.querySelector('[name="visibility"]').value;
          const status = host.querySelector('[name="status"]').value;
          const ownerId = host.querySelector('[name="ownerId"]').value;
          const tags = parseTags(host.querySelector('[name="tags"]').value);
          const desc = host.querySelector('[name="desc"]').value.trim();
          store.set((s2) => {
            if (mode === "create") s2.assets.push({ id: uid("as"), spaceId: s2.activeSpaceId, type, name, refTableId, visibility, status, ownerId, tags, desc, createdAt: nowIso(), updatedAt: nowIso() });
            else if (x) {
              const idx = s2.assets.findIndex((z) => z.id === x.id);
              if (idx >= 0) s2.assets[idx] = { ...s2.assets[idx], type, name, refTableId, visibility, status, ownerId, tags, desc, updatedAt: nowIso() };
            }
            return s2;
          });
          close();
          toast("资产已保存", name, "good");
          router.render();
        });
      },
    });
  };

  const openAssetRequest = (assetId) => {
    const s = store.get();
    const me = helpers.activeUser(s);
    const a = store.byId(s.assets, assetId);
    if (!a) return;
    modal.open({
      title: `申请权限：${a.name}`,
      body: `<div class="form"><div class="field field--12"><div class="label">申请理由</div><textarea name="reason" placeholder="说明用途、范围、字段、时效…"></textarea></div></div>`,
      foot: `<button class="btn btn--ghost" data-modal-close>取消</button><button class="btn btn--primary" data-action="req.create">提交申请</button>`,
      onReady: ({ host, close }) => {
        host.querySelector('[data-action="req.create"]').addEventListener("click", () => {
          const reason = host.querySelector('[name="reason"]').value.trim();
          if (!reason) return toast("请填写申请理由", "理由越具体越容易通过。", "warn");
          store.set((s2) => {
            s2.accessRequests.push({ id: uid("req"), assetId: a.id, spaceId: s2.activeSpaceId, requesterId: me?.id, reason, status: "待审批", approverId: "", decidedAt: "", comment: "", createdAt: nowIso() });
            return s2;
          });
          close();
          toast("申请已提交", "", "good");
          router.render();
        });
      },
    });
  };

  const openReqView = (reqId) => {
    const s = store.get();
    const me = helpers.activeUser(s);
    const r = store.byId(s.accessRequests, reqId);
    if (!r) return;
    const a = store.byId(s.assets, r.assetId);
    const canDecide = (helpers.canApprove(me) || a?.ownerId === me?.id) && r.status === "待审批";
    modal.open({
      title: "申请单详情",
      body: `
        <div class="grid">
          <div class="panel" style="padding:12px">
            <div class="panel__title"><h2>资产</h2><div>${tag(r.status, toneOf(r.status))}</div></div>
            <div class="panel__body">
              <div style="font-weight:800">${esc(a?.name ?? "-")}</div>
              <div class="muted" style="margin-top:6px">发起人：${esc(helpers.userName(s, r.requesterId))} · 时间：${esc(fmtTime(r.createdAt))}</div>
              <div style="margin-top:10px">${esc(r.reason || "-")}</div>
              ${r.status !== "待审批" ? `<div class="muted" style="margin-top:10px">审批人：${esc(helpers.userName(s, r.approverId))} · 时间：${esc(fmtTime(r.decidedAt))}</div>${r.comment ? `<div style="margin-top:8px">${esc(r.comment)}</div>` : ""}` : ""}
            </div>
          </div>
        </div>
      `,
      foot: `<button class="btn btn--ghost" data-modal-close>关闭</button>${canDecide ? `<button class="btn" data-action="req.approve.inline">通过</button><button class="btn btn--danger" data-action="req.reject.inline">驳回</button>` : ""}`,
      onReady: ({ host, close }) => {
        const decide = (status) => {
          modal.open({
            title: status === "已通过" ? "通过申请" : "驳回申请",
            body: `<div class="form"><div class="field field--12"><div class="label">审批意见（可选）</div><textarea name="comment"></textarea></div></div>`,
            foot: `<button class="btn btn--ghost" data-modal-close>取消</button><button class="btn btn--primary" data-action="req.decide">确认</button>`,
            onReady: ({ host: h2, close: c2 }) => {
              h2.querySelector('[data-action="req.decide"]').addEventListener("click", () => {
                const comment = h2.querySelector('[name="comment"]').value.trim();
                store.set((s2) => {
                  const idx = s2.accessRequests.findIndex((x) => x.id === r.id);
                  if (idx >= 0) s2.accessRequests[idx] = { ...s2.accessRequests[idx], status, approverId: s2.activeUserId, decidedAt: nowIso(), comment };
                  return s2;
                });
                c2();
                close();
                toast("已处理申请", status, "good");
                router.render();
              });
            },
          });
        };
        host.addEventListener("click", (e) => {
          const btn = e.target.closest("button[data-action]");
          if (!btn) return;
          if (btn.dataset.action === "req.approve.inline") decide("已通过");
          if (btn.dataset.action === "req.reject.inline") decide("已驳回");
        });
      },
    });
  };

  const openStdForm = (mode, id) => {
    const s = store.get();
    const me = helpers.activeUser(s);
    const x = id ? store.byId(s.standards, id) : null;
    if (mode === "edit" && x && !(helpers.canManageAny(me) || x.ownerId === me?.id)) return toast("无权限编辑", "仅负责人/平台管理员可编辑。", "warn");
    modal.open({
      title: mode === "create" ? "新增标准" : `编辑标准：${x?.name ?? ""}`,
      body: `
        <div class="form">
          <div class="field field--4"><div class="label">分类</div><select name="category">${["字段", "码表", "命名"].map((c) => `<option value="${esc(c)}" ${x?.category === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></div>
          <div class="field field--8"><div class="label">名称</div><input class="input" name="name" value="${esc(x?.name ?? "")}" /></div>
          <div class="field field--6"><div class="label">编码</div><input class="input" name="code" value="${esc(x?.code ?? "")}" /></div>
          <div class="field field--6"><div class="label">范围/主题域</div><input class="input" name="scope" value="${esc(x?.scope ?? "")}" /></div>
          <div class="field field--4"><div class="label">数据类型</div><input class="input" name="dataType" value="${esc(x?.dataType ?? "")}" /></div>
          <div class="field field--4"><div class="label">长度</div><input class="input" name="length" value="${esc(x?.length ?? "")}" /></div>
          <div class="field field--4"><div class="label">格式/约束</div><input class="input" name="format" value="${esc(x?.format ?? "")}" /></div>
          <div class="field field--12"><div class="label">允许值（码表用 | 分隔）</div><input class="input" name="allowedValues" value="${esc(x?.allowedValues ?? "")}" /></div>
          <div class="field field--6"><div class="label">负责人</div><select name="ownerId">${s.users.map((u) => `<option value="${esc(u.id)}" ${x?.ownerId === u.id || (!x && u.id === me?.id) ? "selected" : ""}>${esc(u.name)} · ${esc(u.role)}</option>`).join("")}</select></div>
          <div class="field field--6"><div class="label">评审人</div><select name="reviewerId"><option value="">（未指定）</option>${s.users.map((u) => `<option value="${esc(u.id)}" ${x?.reviewerId === u.id ? "selected" : ""}>${esc(u.name)} · ${esc(u.role)}</option>`).join("")}</select></div>
          <div class="field field--12"><div class="label">说明</div><textarea name="desc">${esc(x?.desc ?? "")}</textarea></div>
        </div>
      `,
      foot: `<button class="btn btn--ghost" data-modal-close>取消</button><button class="btn btn--primary" data-action="std.save">${mode === "create" ? "创建" : "保存"}</button>`,
      onReady: ({ host, close }) => {
        host.querySelector('[data-action="std.save"]').addEventListener("click", () => {
          const category = host.querySelector('[name="category"]').value;
          const name = host.querySelector('[name="name"]').value.trim();
          if (!name) return toast("标准名称不能为空", "", "warn");
          const code = host.querySelector('[name="code"]').value.trim();
          const scope = host.querySelector('[name="scope"]').value.trim();
          const dataType = host.querySelector('[name="dataType"]').value.trim();
          const length = host.querySelector('[name="length"]').value.trim();
          const format = host.querySelector('[name="format"]').value.trim();
          const allowedValues = host.querySelector('[name="allowedValues"]').value.trim();
          const ownerId = host.querySelector('[name="ownerId"]').value;
          const reviewerId = host.querySelector('[name="reviewerId"]').value;
          const desc = host.querySelector('[name="desc"]').value.trim();
          store.set((s2) => {
            if (mode === "create") {
              const nid = uid("std");
              s2.standards.push({ id: nid, spaceId: s2.activeSpaceId, category, code, name, scope, dataType, length, format, allowedValues, desc, status: "草稿", ownerId, reviewerId, version: 1, createdAt: nowIso(), updatedAt: nowIso(), publishedAt: "" });
              s2.standardReviews.push({ id: uid("rev"), standardId: nid, action: "创建", byUserId: s2.activeUserId, at: nowIso(), comment: "" });
            } else if (x) {
              const idx = s2.standards.findIndex((z) => z.id === x.id);
              if (idx >= 0) {
                const prev = s2.standards[idx];
                const bump = ["草稿", "已退回", "已驳回"].includes(prev.status) && (name !== prev.name || code !== prev.code || allowedValues !== prev.allowedValues || dataType !== prev.dataType || length !== prev.length || format !== prev.format || desc !== prev.desc);
                s2.standards[idx] = { ...prev, category, code, name, scope, dataType, length, format, allowedValues, desc, ownerId, reviewerId, version: bump ? prev.version + 1 : prev.version, updatedAt: nowIso() };
                s2.standardReviews.push({ id: uid("rev"), standardId: x.id, action: "编辑", byUserId: s2.activeUserId, at: nowIso(), comment: "" });
              }
            }
            return s2;
          });
          close();
          toast("标准已保存", name, "good");
          router.render();
        });
      },
    });
  };

  const openStdTimeline = (id) => {
    const s = store.get();
    const x = store.byId(s.standards, id);
    if (!x) return;
    const logs = s.standardReviews.filter((r) => r.standardId === x.id).slice().sort((a, b) => a.at.localeCompare(b.at));
    modal.open({
      title: `评审流程：${x.name}`,
      body: `
        <div class="grid">
          <div class="panel" style="padding:12px">
            <div class="panel__title"><h2>当前状态</h2><div>${tag(x.status, toneOf(x.status))} ${tag(`v${x.version}`, "mono")}</div></div>
            <div class="panel__body"><div class="muted">负责人：${esc(helpers.userName(s, x.ownerId))} · 评审人：${esc(x.reviewerId ? helpers.userName(s, x.reviewerId) : "-")}</div></div>
          </div>
          <div class="panel" style="padding:12px">
            <div class="panel__title"><h2>审计轨迹</h2><div class="hint">每一步都会记录</div></div>
            <div class="panel__body">
              <table class="table">
                <thead><tr><th>时间</th><th style="width:120px">动作</th><th style="width:160px">操作者</th><th>备注</th></tr></thead>
                <tbody>
                  ${logs
                    .map(
                      (r) => `<tr><td>${esc(fmtTime(r.at))}</td><td>${tag(r.action, r.action === "通过" || r.action === "发布" ? "good" : r.action === "退回" ? "warn" : r.action === "驳回" ? "bad" : "mono")}</td><td>${esc(helpers.userName(s, r.byUserId))}</td><td>${esc(r.comment || "-")}</td></tr>`
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `,
      foot: `<button class="btn btn--ghost" data-modal-close>关闭</button>`,
    });
  };

  const submitStd = (id) => {
    const s = store.get();
    const me = helpers.activeUser(s);
    const x = store.byId(s.standards, id);
    if (!x) return;
    if (!(helpers.canManageAny(me) || x.ownerId === me?.id)) return toast("无权限提交", "仅负责人/平台管理员可提交评审。", "warn");
    if (!["草稿", "已退回"].includes(x.status)) return toast("当前状态不可提交", `状态：${x.status}`, "warn");
    modal.open({
      title: "提交评审",
      body: `
        <div class="form">
          <div class="field field--12"><div class="label">指定评审人</div>
            <select name="reviewerId">${s.users.map((u) => `<option value="${esc(u.id)}" ${x.reviewerId === u.id ? "selected" : ""}>${esc(u.name)} · ${esc(u.role)}</option>`).join("")}</select>
          </div>
          <div class="field field--12"><div class="label">提交说明（可选）</div><textarea name="comment"></textarea></div>
        </div>
      `,
      foot: `<button class="btn btn--ghost" data-modal-close>取消</button><button class="btn btn--primary" data-action="std.submit.confirm">提交</button>`,
      onReady: ({ host, close }) => {
        host.querySelector('[data-action="std.submit.confirm"]').addEventListener("click", () => {
          const reviewerId = host.querySelector('[name="reviewerId"]').value;
          const comment = host.querySelector('[name="comment"]').value.trim();
          store.set((s2) => {
            const idx = s2.standards.findIndex((z) => z.id === x.id);
            if (idx >= 0) s2.standards[idx] = { ...s2.standards[idx], status: "待评审", reviewerId, updatedAt: nowIso() };
            s2.standardReviews.push({ id: uid("rev"), standardId: x.id, action: "提交", byUserId: s2.activeUserId, at: nowIso(), comment });
            return s2;
          });
          close();
          toast("已提交评审", x.name, "good");
          router.render();
        });
      },
    });
  };

  const reviewStd = (id) => {
    const s = store.get();
    const me = helpers.activeUser(s);
    const x = store.byId(s.standards, id);
    if (!x) return;
    if (!helpers.canApprove(me)) return toast("无评审权限", "请切换到 审核员/治理管理员/平台管理员。", "warn");
    if (x.status !== "待评审") return toast("当前不在待评审状态", `状态：${x.status}`, "warn");
    modal.open({
      title: `进入评审：${x.name}`,
      body: `
        <div class="grid">
          <div class="panel" style="padding:12px">
            <div class="panel__title"><h2>标准内容</h2><div>${tag(x.category, "mono")} ${tag(`v${x.version}`, "mono")} ${tag(x.status, "warn")}</div></div>
            <div class="panel__body">
              <div class="muted">编码：${esc(x.code || "-")} · 范围：${esc(x.scope || "-")}</div>
              <div class="muted" style="margin-top:6px">类型：${esc(x.dataType || "-")} · 长度：${esc(x.length || "-")} · 格式：${esc(x.format || "-")}</div>
              ${x.allowedValues ? `<div style="margin-top:8px">码值：${esc(x.allowedValues)}</div>` : ""}
              ${x.desc ? `<div style="margin-top:8px">${esc(x.desc)}</div>` : ""}
            </div>
          </div>
          <div class="panel" style="padding:12px">
            <div class="panel__title"><h2>评审意见</h2><div class="hint">退回：可修改后再提交</div></div>
            <div class="panel__body"><textarea name="comment" placeholder="写下意见、修改点、通过理由等…"></textarea></div>
          </div>
        </div>
      `,
      foot: `<button class="btn btn--ghost" data-modal-close>取消</button><button class="btn" data-action="std.pass">通过并发布</button><button class="btn btn--danger" data-action="std.reject">驳回</button><button class="btn" data-action="std.return">退回修改</button>`,
      onReady: ({ host, close }) => {
        const decide = (nextStatus, action) => {
          const comment = host.querySelector('[name="comment"]').value.trim();
          store.set((s2) => {
            const idx = s2.standards.findIndex((z) => z.id === x.id);
            if (idx >= 0) {
              const publishedAt = nextStatus === "已发布" ? nowIso() : s2.standards[idx].publishedAt;
              s2.standards[idx] = { ...s2.standards[idx], status: nextStatus, updatedAt: nowIso(), publishedAt };
            }
            s2.standardReviews.push({ id: uid("rev"), standardId: x.id, action, byUserId: s2.activeUserId, at: nowIso(), comment });
            if (nextStatus === "已发布") s2.standardReviews.push({ id: uid("rev"), standardId: x.id, action: "发布", byUserId: s2.activeUserId, at: nowIso(), comment: "评审通过后自动发布（原型策略）" });
            return s2;
          });
          close();
          toast("评审已完成", nextStatus, "good");
          router.render();
        };
        host.addEventListener("click", (e) => {
          const btn = e.target.closest("button[data-action]");
          if (!btn) return;
          if (btn.dataset.action === "std.pass") decide("已发布", "通过");
          if (btn.dataset.action === "std.reject") decide("已驳回", "驳回");
          if (btn.dataset.action === "std.return") decide("已退回", "退回");
        });
      },
    });
  };

  // ---------- Global event wiring ----------
  const handleAction = (act, id, target) => {
    const s = store.get();
    const me = helpers.activeUser(s);

    if (act === "space.create") return openSpaceForm("create");
    if (act === "space.edit") return openSpaceForm("edit", id);
    if (act === "space.activate") {
      store.set((s2) => ((s2.activeSpaceId = id), s2));
      ui.renderSelects();
      toast("已切换分层", helpers.activeSpace(store.get())?.name ?? "", "good");
      return router.render();
    }
    if (act === "space.delete") {
      const x = store.byId(s.spaces, id);
      if (!x) return;
      return confirmDelete({
        title: `删除分层：${x.name}`,
        detail: "演示原型：会同时删除该分层下的数据源、表、字段、血缘、资产、标准与申请单。",
        onYes: () => {
          store.set((s2) => {
            const dsIds = s2.datasources.filter((d) => d.spaceId === id).map((d) => d.id);
            const tbIds = s2.tables.filter((t) => t.spaceId === id).map((t) => t.id);
            const asIds = s2.assets.filter((a) => a.spaceId === id).map((a) => a.id);
            const stdIds = s2.standards.filter((st) => st.spaceId === id).map((st) => st.id);
            s2.spaces = s2.spaces.filter((sp) => sp.id !== id);
            s2.datasources = s2.datasources.filter((d) => d.spaceId !== id);
            s2.tables = s2.tables.filter((t) => t.spaceId !== id);
            s2.columns = s2.columns.filter((c) => !tbIds.includes(c.tableId));
            s2.lineageEdges = s2.lineageEdges.filter((e) => !tbIds.includes(e.fromTableId) && !tbIds.includes(e.toTableId));
            s2.assets = s2.assets.filter((a) => a.spaceId !== id);
            s2.accessRequests = s2.accessRequests.filter((r) => !asIds.includes(r.assetId));
            s2.standards = s2.standards.filter((st) => st.spaceId !== id);
            s2.standardReviews = s2.standardReviews.filter((r) => !stdIds.includes(r.standardId));
            if (s2.activeSpaceId === id) s2.activeSpaceId = s2.spaces[0]?.id ?? null;
            if (state.meta.selectedDsId && dsIds.includes(state.meta.selectedDsId)) state.meta.selectedDsId = "";
            return s2;
          });
          ui.renderSelects();
          toast("分层已删除", x.name, "good");
          router.render();
        },
      });
    }

    if (act === "ds.create") return openDsForm("create");
    if (act === "ds.edit") return openDsForm("edit", id);
    if (act === "ds.select") {
      state.meta.selectedDsId = id;
      return router.render();
    }
    if (act === "ds.delete") {
      const x = store.byId(s.datasources, id);
      if (!x) return;
      return confirmDelete({
        title: `删除数据源：${x.name}`,
        detail: "会删除其下所有表、字段与相关血缘；资产对引用表将清空引用（演示）。",
        onYes: () => {
          store.set((s2) => {
            const tbIds = s2.tables.filter((t) => t.datasourceId === id).map((t) => t.id);
            s2.datasources = s2.datasources.filter((d) => d.id !== id);
            s2.tables = s2.tables.filter((t) => t.datasourceId !== id);
            s2.columns = s2.columns.filter((c) => !tbIds.includes(c.tableId));
            s2.lineageEdges = s2.lineageEdges.filter((e) => !tbIds.includes(e.fromTableId) && !tbIds.includes(e.toTableId));
            s2.assets = s2.assets.map((a) => (a.refTableId && tbIds.includes(a.refTableId) ? { ...a, refTableId: "", updatedAt: nowIso() } : a));
            if (state.meta.selectedDsId === id) state.meta.selectedDsId = "";
            return s2;
          });
          toast("数据源已删除", x.name, "good");
          router.render();
        },
      });
    }

    if (act === "table.create") return openTableForm("create");
    if (act === "table.edit") return openTableForm("edit", id);
    if (act === "table.delete") {
      const x = store.byId(s.tables, id);
      if (!x) return;
      return confirmDelete({
        title: `删除表：${x.schema}.${x.name}`,
        detail: "会删除字段与相关血缘；资产对引用表将清空引用（演示）。",
        onYes: () => {
          store.set((s2) => {
            s2.tables = s2.tables.filter((t) => t.id !== id);
            s2.columns = s2.columns.filter((c) => c.tableId !== id);
            s2.lineageEdges = s2.lineageEdges.filter((e) => e.fromTableId !== id && e.toTableId !== id);
            s2.assets = s2.assets.map((a) => (a.refTableId === id ? { ...a, refTableId: "", updatedAt: nowIso() } : a));
            return s2;
          });
          toast("表已删除", "", "good");
          router.render();
        },
      });
    }
    if (act === "table.detail") return openTableDetail(id);

    if (act === "asset.create") return openAssetForm("create");
    if (act === "asset.edit") return openAssetForm("edit", id);
    if (act === "asset.toggle") {
      store.set((s2) => {
        const idx = s2.assets.findIndex((a) => a.id === id);
        if (idx >= 0) {
          const cur = s2.assets[idx];
          const next = cur.status === "已发布" ? "已下架" : "已发布";
          s2.assets[idx] = { ...cur, status: next, updatedAt: nowIso() };
        }
        return s2;
      });
      toast("资产状态已更新", "", "good");
      return router.render();
    }
    if (act === "asset.delete") {
      const x = store.byId(s.assets, id);
      if (!x) return;
      if (!(helpers.canManageAny(me) || x.ownerId === me?.id)) return toast("无权限删除", "仅负责人/平台管理员可删除。", "warn");
      return confirmDelete({
        title: `删除资产：${x.name}`,
        detail: "会同时删除相关申请单（演示）。",
        onYes: () => {
          store.set((s2) => {
            s2.assets = s2.assets.filter((a) => a.id !== id);
            s2.accessRequests = s2.accessRequests.filter((r) => r.assetId !== id);
            return s2;
          });
          toast("资产已删除", x.name, "good");
          router.render();
        },
      });
    }
    if (act === "asset.request") return openAssetRequest(id);

    if (act === "req.view") return openReqView(id);
    if (act === "req.approve" || act === "req.reject") {
      const r = store.byId(s.accessRequests, id);
      if (!r) return;
      const a = store.byId(s.assets, r.assetId);
      const canDecide = (helpers.canApprove(me) || a?.ownerId === me?.id) && r.status === "待审批";
      if (!canDecide) return toast("无权限审批", "", "warn");
      return openReqView(id);
    }

    if (act === "std.create") return openStdForm("create");
    if (act === "std.edit") return openStdForm("edit", id);
    if (act === "std.delete") {
      const x = store.byId(s.standards, id);
      if (!x) return;
      const can = helpers.canManageAny(me) || x.ownerId === me?.id;
      if (!can) return toast("无权限删除", "", "warn");
      return confirmDelete({
        title: `删除标准：${x.name}`,
        detail: "仅演示：会删除该标准的评审记录；已绑定字段不会自动解除（可手动改字段）。",
        onYes: () => {
          store.set((s2) => {
            s2.standards = s2.standards.filter((st) => st.id !== id);
            s2.standardReviews = s2.standardReviews.filter((r) => r.standardId !== id);
            return s2;
          });
          toast("标准已删除", x.name, "good");
          router.render();
        },
      });
    }
    if (act === "std.timeline") return openStdTimeline(id);
    if (act === "std.submit") return submitStd(id);
    if (act === "std.review") return reviewStd(id);
  };

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const act = btn.dataset.action;
    const id = btn.dataset.id || "";
    // input elements also use data-action for change; ignore here
    if (btn.tagName === "INPUT" || btn.tagName === "TEXTAREA" || btn.tagName === "SELECT") return;
    handleAction(act, id, btn);
  });

  document.addEventListener("input", (e) => {
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;
    const act = el.dataset.action;
    if (!act) return;
    if (act === "meta.search") {
      state.meta.tableSearch = el.value;
      router.render();
    }
    if (act === "plaza.search") {
      state.plaza.search = el.value;
      router.render();
    }
  });

  document.addEventListener("change", (e) => {
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;
    const act = el.dataset.action;
    if (!act) return;
    if (act === "plaza.scope") {
      state.plaza.scope = el.value;
      router.render();
    }
    if (act === "plaza.reqFilter") {
      state.plaza.reqFilter = el.value;
      router.render();
    }
  });

  $("#spaceSelect").addEventListener("change", (e) => {
    const id = e.target.value;
    store.set((s) => ((s.activeSpaceId = id), s));
    toast("已切换分层", helpers.activeSpace(store.get())?.name ?? "", "good");
    router.render();
  });
  $("#userSelect").addEventListener("change", (e) => {
    const id = e.target.value;
    store.set((s) => ((s.activeUserId = id), s));
    toast("已切换用户", helpers.activeUser(store.get())?.name ?? "", "good");
    router.render();
  });
  $("#btnResetDemo").addEventListener("click", () => {
    store.reset();
    ui.renderSelects();
    toast("已重置演示数据", "localStorage 已覆盖为默认示例", "good");
    router.render();
  });
  window.addEventListener("hashchange", () => router.render());

  // Init
  store.get();
  ui.renderSelects();
  if (!location.hash) location.hash = "#/spaces";
  router.render();

  // for debugging
  window.DP = { store, state, router };
})();
