(() => {
  'use strict';

  const layout = {
    '坐席工作台': [
      ['培育作业', ['PAGE-2202', 'PAGE-21008', 'PAGE-21015', 'PAGE-21027', 'PAGE-21005']]
    ],
    '业务&客户': [
      ['线索与客户', ['PAGE-2204', 'PAGE-2226', 'PAGE-2203']],
      ['培育与下发', ['PAGE-21011', 'PAGE-21012', 'PAGE-21013']],
      ['业务配置', ['PAGE-2006', 'PAGE-2223', 'PAGE-21025', 'PAGE-21026']]
    ],
    '呼叫中心': [
      ['AI 外呼', [
        'PAGE-2103', 'PAGE-2110', 'PAGE-2111', 'PAGE-2007',
        'PAGE-2102', 'PAGE-2112'
      ]],
      ['云呼叫', ['PAGE-2205']],
      ['通话记录', ['PAGE-2108', 'PAGE-2208', 'PAGE-2109']],
      ['质检管理', ['PAGE-21017', 'PAGE-21018', 'PAGE-21019', 'PAGE-21023', 'PAGE-21024']],
      ['坐席与排班', ['PAGE-2210', 'PAGE-21001', 'PAGE-21014', 'PAGE-2211', 'PAGE-2212', 'PAGE-2213', 'PAGE-2214']],
      ['话务资源', ['PAGE-2215', 'PAGE-2216', 'PAGE-2217', 'PAGE-2218']]
    ],
    '报表中心': [
      ['AI 外呼报表', ['PAGE-2105', 'PAGE-2106']],
      ['', ['PAGE-2209']]
    ],
    '系统管理': [
      ['组织与权限', ['PAGE-2003', 'PAGE-2004', 'PAGE-2005']],
      ['基础配置', ['PAGE-21007', 'PAGE-21016']],
      ['接入配置', ['PAGE-2220', 'PAGE-21022', 'PAGE-2219']],
      ['审计与核对', ['PAGE-2222', 'PAGE-2221']]
    ]
  };
  const parent = {'PAGE-2227':'PAGE-2226', 'PAGE-2225':'PAGE-2202'};
  const menuId = id => parent[id] || id;
  const placements = new Map();
  for (const [area,groups] of Object.entries(layout)) {
    for (const [label,ids] of groups) {
      for (const id of ids) {
        if (!placements.has(id)) placements.set(id,[]);
        placements.get(id).push([area,label]);
      }
    }
  }
  const areas = pages => DNav.areas.filter(area=>sections(area,pages).length);

  function sections(area, pages) {
    // Permissions only filter leaves; a configured page always keeps its placement.
    const visible = new Map(pages.map(page=>[page.id,page]));
    const groups = (layout[area] || []).map(([label,ids])=>({
      label,pages:ids.map(id=>visible.get(id)).filter(Boolean)
    })).filter(group=>group.pages.length);

    // New pages without a layout entry retain their registered area and group.
    for (const page of pages.filter(page=>page.area===area && !placements.has(page.id))) {
      const existing = page.group && groups.find(group=>group.label===page.group);
      if (existing) existing.pages.push(page);
      else groups.push({label:page.group,pages:[page]});
    }
    return groups;
  }

  function areaFor(page, pages, preferred) {
    if (!page) return '';
    const matches = areas(pages).filter(area=>sections(area,pages).some(group=>
      group.pages.some(item=>item.id===menuId(page.id))));
    return [preferred,page.area].find(area=>matches.includes(area)) || matches[0] || page.area;
  }

  function path(page) {
    const destinations = placements.get(menuId(page.id)) || [];
    const [area,label] = destinations.find(([tab])=>tab===page.area) || destinations[0] || [page.area,page.group];
    return [area,label,page.name].filter(Boolean);
  }

  DNav.sidebar = {areas,sections,areaFor,path,menuId};
})();
