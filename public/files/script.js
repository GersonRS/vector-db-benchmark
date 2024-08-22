let engineToColor = {
  redis: "#5961FF",
  milvus: "#1493cc",
  weaviate: "#01cc26",
  qdrant: "#bc1439",
  elasticsearch: "#f9b110",
  elastic: "#f9b110"
}
  , lowerIsBetterMap = {
    rps: !1,
    mean_precisions: !1,
    mean_time: !0,
    p95_time: !0,
    p99_time: !0,
    upload_time: !0,
    total_time: !0,
    total_upload_time: !0
  };
const normalizedTitles = {
  total_time: "Total Time (s)",
  engine_name: "Engine",
  dataset_name: "Dataset",
  rps: "RPS",
  mean_precisions: "Precision",
  total_upload_time: "Upload + Index Time(m)",
  upload_time: "Upload Time(m)",
  mean_time: "Latency(ms)",
  p95_time: "P95(ms)",
  p99_time: "P99(ms)",
  setup_name: "Setup"
}
  , titleOrder = ["engine_name", "setup_name", "dataset_name", "upload_time", "total_upload_time", "mean_time", "p95_time", "p99_time", "rps", "mean_precisions"]
  , columnMultiplyFactor = {
    total_upload_time: 1 / 60,
    upload_time: 1 / 60,
    mean_time: 1e3,
    p95_time: 1e3,
    p99_time: 1e3
  };
function extractUniqueVals(e, t) {
  let n = {};
  for (const s of e)
    n[s[t]] = 1;
  return [...Object.keys(n)]
}
function getDatasetsList(e) {
  return extractUniqueVals(e, "dataset_name")
}
function getParallelOptions(e) {
  return extractUniqueVals(e, "parallel")
}
function filterData(e, t) {
  let n = [];
  for (const s of e) {
    let o = !0;
    for (const e in t)
      if (s[e] !== t[e]) {
        o = !1;
        break
      }
    o && n.push(s)
  }
  return n
}
function filterBestPoints(e, t) {
  let n = [];
  e.sort((e, t) => t.x - e.x);
  let s = e[0].y;
  n.push(e[0]);
  for (const o of e) {
    let i = o.y > s;
    t && (i = o.y < s),
      i && (n.push(o),
        s = o.y)
  }
  return n
}
function getPrecisionVsValue(e, t) {
  let n = [];
  for (const s of e)
    n.push({
      x: s.mean_precisions,
      y: s[t],
      ...s
    });
  return n.sort((e, t) => e.x - t.x),
    n = filterBestPoints(n, lowerIsBetterMap[t]),
    n
}
function getPlotDataForEngine(e, t, n) {
  let s = filterData(e, {
    engine_name: t
  });
  return {
    label: t,
    data: getPrecisionVsValue(s, n),
    parsing: !1,
    borderColor: engineToColor[t],
    cubicInterpolationMode: "monotone"
  }
}
function getPlotData(e, t) {
  let s = extractUniqueVals(e, "engine_name")
    , n = [];
  for (const o of s)
    n.push(getPlotDataForEngine(e, o, t));
  return n
}
function selectByPrecision(e, t) {
  let n = [];
  for (const s of e)
    s.mean_precisions >= t && n.push(s);
  return n
}
function selectDataForTable(e, t) {
  let o = lowerIsBetterMap[t]
    , n = {};
  for (const s of e) {
    let i = s.engine_name;
    if (n[i]) {
      let e = n[i];
      o ? s[t] < e[t] && (n[i] = s) : s[t] > e[t] && (n[i] = s)
    } else
      n[i] = s
  }
  let s = Object.values(n);
  return o ? s.sort((e, n) => e[t] - n[t]) : s.sort((e, n) => n[t] - e[t]),
    s
}
function updataDropdown(e, t) {
  for (; e.firstChild;)
    e.removeChild(e.firstChild);
  for (let n = 0; n < t.length; n++) {
    let s = document.createElement("option");
    s.value = t[n],
      s.text = t[n],
      e.appendChild(s)
  }
}
function getSelectedValue(e) {
  return e.options[e.selectedIndex].value
}
function getRadioButtonValue(e) {
  for (let t = 0; t < e.length; t++)
    if (e[t].checked)
      return e[t].value
}
function renderPlot(e, t) {
  e.data.datasets = t,
    e.update()
}
function getSelectedData(e) {
  let t = window.datasets[e]
    , n = document.getElementById("datasets-selector-" + e)
    , s = document.getElementById("parallel-selector-" + e)
    , o = getSelectedValue(n)
    , i = getSelectedValue(s)
    , a = parseInt(i)
    , r = filterData(t, {
      dataset_name: o,
      parallel: a
    });
  return r
}
function updateLine(e, t) {
  let n = window.charts[e];
  n.data.datasets.pop(),
    drawLine(n, t);
  let o = document.getElementsByName("plot-value-" + e)
    , s = getRadioButtonValue(o)
    , i = getSelectedData(e)
    , a = selectByPrecision(i, t)
    , r = selectDataForTable(a, s);
  renderTable(r, e, s)
}
function drawLine(e, t) {
  e.data.datasets.push({
    type: "bar",
    label: "Precision cutoff",
    maxBarThickness: 2,
    backgroundColor: "#ff000033",
    parsing: !1,
    data: [{
      x: t,
      y: e.scales.y.max,
      setup_name: "cutoff"
    }]
  }),
    e.update()
}
function renderSelected(e) {
  let n = window.charts[e]
    , r = document.getElementsByName("plot-value-" + e)
    , s = document.getElementById("precision-selector-" + e)
    , a = getSelectedData(e)
    , o = getRadioButtonValue(r);
  n.options.scales.y.title.text = o;
  let c = getPlotData(a, o);
  renderPlot(n, c);
  let t = [n.scales.x.min, n.scales.x.max];
  s.min = t[0],
    s.max = t[1],
    s.step = (t[1] - t[0]) / 100;
  let i = t[0] + (t[1] - t[0]) / 2;
  s.value = i,
    drawLine(n, i);
  let l = selectByPrecision(a, i)
    , d = selectDataForTable(l, o);
  renderTable(d, e, o)
}
const renderTable = function (e, t, n) {
  if (!e[0])
    return;
  let o = titleOrder;
  const i = o.map(e => {
    let t = e;
    if (normalizedTitles.hasOwnProperty(e))
      t = normalizedTitles[e];
    else
      return "";
    return `<th scope="col">${t}</th>`
  }
  )
    , a = e.map(e => {
      const t = titleOrder.map((t, s) => {
        let i = e[t];
        return normalizedTitles.hasOwnProperty(t) ? t === "setup_name" ? `<td title='${JSON.stringify(e.engine_params)}'><u>${i}</u></td>` : (typeof i == "object" && (i = JSON.stringify(i)),
          typeof i == "number" && Math.trunc(i) !== i && (i = i.toFixed(20).match(/^-?\d*\.?0*\d{0,2}/)[0]),
          o[s] === n ? `<th scope="row">${i}</th>` : `<td>${i}</td>`) : ""
      }
      );
      return `<tr>${t.join("")}</tr>`
    }
    )
    , s = document.createElement("table");
  s.classList.add("table", "table-striped"),
    s.innerHTML = `<thead><tr>${i.join("")}</tr></thead><tbody>${a.join("")}</tbody>`,
    document.getElementById("table-" + t).querySelector(".table") && document.getElementById("table-" + t).querySelector(".table").remove(),
    document.getElementById("table-" + t).classList.add("table-responsive", "table-responsive-md"),
    document.getElementById("table-" + t).append(s)
}
