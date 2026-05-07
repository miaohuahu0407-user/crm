/**
 * @name CRM 客户列表页
 *
 * 参考资料：
 * - /rules/development-guide.md
 * - /src/prototypes/crm-customer-list/spec.md
 */

import './style.css';

import React, { forwardRef, useImperativeHandle, useState } from 'react';
import {
  Bell,
  Boxes,
  ChevronDown,
  ChevronRight,
  CircleEllipsis,
  Clock3,
  Factory,
  FileText,
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Truck,
  UserRound,
  Users,
  Wallet,
  Warehouse,
} from 'lucide-react';

import type {
  Action,
  AxureHandle,
  AxureProps,
  ConfigItem,
  DataDesc,
  EventItem,
  KeyDesc,
} from '../../common/axure-types';

type CustomerRow = {
  id: string;
  name: string;
  owner: string;
  followUpBy: string;
  customerType: string;
  mobileLevel: string;
  annualAmount: string;
  autoLevel: string;
  tags: string;
  region: string;
  createdAt: string;
  lastFollowAt: string;
  lastOrderAt: string;
};

type NavItem = {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
};

type NavGroup = {
  label: string;
  icon: React.ReactNode;
  items?: NavItem[];
};

const EVENT_LIST: EventItem[] = [
  { name: 'on_search', desc: '点击搜索按钮时触发' },
  { name: 'on_reset', desc: '点击重置按钮时触发' },
  { name: 'on_create_customer', desc: '点击新增客户按钮时触发' },
  { name: 'on_view_customer', desc: '点击客户详情时触发' },
  { name: 'on_delete_customer', desc: '点击删除客户时触发' },
];

const ACTION_LIST: Action[] = [
  { name: 'reset_filters', desc: '重置页面筛选条件' },
];

const VAR_LIST: KeyDesc[] = [
  { name: 'selected_customer_id', desc: '当前点击详情的客户编号' },
  { name: 'customer_count', desc: '当前表格展示的客户数量' },
];

const CONFIG_LIST: ConfigItem[] = [
  {
    type: 'input',
    attributeId: 'operator_name',
    displayName: '操作人名称',
    info: '显示在右上角头像左侧的用户名',
    initialValue: '阿塔咪',
  },
];

const DATA_LIST: DataDesc[] = [
  {
    name: 'customers',
    desc: '客户列表数据',
    keys: [
      { name: 'id', desc: '客户编号' },
      { name: 'name', desc: '客户名称' },
      { name: 'owner', desc: '归属人' },
      { name: 'follow_up_by', desc: '跟进人' },
      { name: 'customer_type', desc: '客户类型' },
      { name: 'mobile_level', desc: '手动层级' },
      { name: 'annual_amount', desc: '近一年累计金额' },
      { name: 'auto_level', desc: '自动层级' },
      { name: 'tags', desc: '标签' },
      { name: 'region', desc: '国家地区' },
      { name: 'created_at', desc: '创建时间' },
      { name: 'last_follow_at', desc: '最近跟进时间' },
      { name: 'last_order_at', desc: '最近下单时间' },
    ],
  },
];

const PAGE_TAGS = ['仪表盘', '订单列表', '组织架构', '账号详情', '客户列表'];

const NAV_GROUPS: NavGroup[] = [
  {
    label: '仪表盘',
    icon: <LayoutDashboard size={14} />,
  },
  {
    label: '产品管理',
    icon: <Package size={14} />,
    items: [
      { label: '产品列表', icon: <Package size={13} /> },
      { label: '预售产品', icon: <ShoppingBag size={13} /> },
      { label: '产品组合', icon: <Boxes size={13} /> },
      { label: '团购列表', icon: <FileText size={13} /> },
    ],
  },
  {
    label: '销售管理',
    icon: <ShoppingBag size={14} />,
    items: [
      { label: '客户列表', icon: <Users size={13} />, active: true },
      { label: '订单列表', icon: <FileText size={13} /> },
    ],
  },
  {
    label: '采购管理',
    icon: <ShoppingCart size={14} />,
    items: [
      { label: '库存预警', icon: <Bell size={13} /> },
      { label: '待采购列表', icon: <Clock3 size={13} /> },
      { label: '已采购列表', icon: <CircleEllipsis size={13} /> },
      { label: '供应商列表', icon: <UserRound size={13} /> },
    ],
  },
  {
    label: '仓储管理',
    icon: <Warehouse size={14} />,
    items: [
      { label: '实时库存', icon: <Warehouse size={13} /> },
      { label: '入库列表', icon: <FileText size={13} /> },
      { label: '发货列表', icon: <Truck size={13} /> },
      { label: '物流公司', icon: <Truck size={13} /> },
      { label: '打包待列表', icon: <Boxes size={13} /> },
    ],
  },
  {
    label: '财务管理',
    icon: <Wallet size={14} />,
  },
  {
    label: '系统管理',
    icon: <Settings size={14} />,
  },
];

const DEFAULT_CUSTOMERS: CustomerRow[] = [
  {
    id: 'K2604210349432034',
    name: '谭****息',
    owner: '阿塔咪',
    followUpBy: '陈敏',
    customerType: '零售商',
    mobileLevel: '-',
    annualAmount: '¥200.00',
    autoLevel: '-',
    tags: '很关注A产品',
    region: '阿尔巴尼亚',
    createdAt: '2026-04-21 15:49:44',
    lastFollowAt: '-',
    lastOrderAt: '-',
  },
  {
    id: 'K2604211152018593',
    name: '谭*******息',
    owner: '陈敏',
    followUpBy: '陈敏',
    customerType: '个人买家',
    mobileLevel: '-',
    annualAmount: '¥9.00',
    autoLevel: '-',
    tags: '',
    region: '奥兰群岛',
    createdAt: '2026-04-21 11:52:01',
    lastFollowAt: '-',
    lastOrderAt: '-',
  },
  {
    id: 'K2604181010241079',
    name: '【*********户',
    owner: '黄家颖',
    followUpBy: '陈敏',
    customerType: '零售商',
    mobileLevel: '-',
    annualAmount: '¥7000.00',
    autoLevel: '-',
    tags: '',
    region: '奥兰群岛',
    createdAt: '2026-04-18 22:10:25',
    lastFollowAt: '-',
    lastOrderAt: '-',
  },
  {
    id: 'K2604170432564758',
    name: '3******户',
    owner: '黄家颖',
    followUpBy: '陈敏',
    customerType: '零售商',
    mobileLevel: '-',
    annualAmount: '¥950.00',
    autoLevel: '-',
    tags: '',
    region: '阿富汗',
    createdAt: '2026-04-17 16:32:56',
    lastFollowAt: '-',
    lastOrderAt: '-',
  },
  {
    id: 'K2604171137422408',
    name: '2******户',
    owner: '黄家颖',
    followUpBy: '张宏强',
    customerType: '批发商',
    mobileLevel: '-',
    annualAmount: '¥8500.00',
    autoLevel: '-',
    tags: '',
    region: '阿拉汗',
    createdAt: '2026-04-17 11:37:42',
    lastFollowAt: '-',
    lastOrderAt: '-',
  },
  {
    id: 'K2604151203542349',
    name: '1******户',
    owner: '黄家颖',
    followUpBy: '-',
    customerType: '零售商',
    mobileLevel: '-',
    annualAmount: '¥21000.00',
    autoLevel: '-',
    tags: '',
    region: '安道尔',
    createdAt: '2026-04-15 12:03:55',
    lastFollowAt: '-',
    lastOrderAt: '-',
  },
  {
    id: 'K2604110922185093',
    name: '关***试',
    owner: '孙杰',
    followUpBy: '-',
    customerType: '零售商',
    mobileLevel: '-',
    annualAmount: '¥1001104.00',
    autoLevel: '-',
    tags: '',
    region: '中国',
    createdAt: '2026-04-11 09:22:18',
    lastFollowAt: '-',
    lastOrderAt: '-',
  },
  {
    id: 'K2604100359431738',
    name: '0******户',
    owner: '黄家颖',
    followUpBy: '陈敏',
    customerType: '零售商',
    mobileLevel: '-',
    annualAmount: '¥94528.00',
    autoLevel: '-',
    tags: '',
    region: '布隆迪',
    createdAt: '2026-04-10 15:59:43',
    lastFollowAt: '-',
    lastOrderAt: '-',
  },
  {
    id: 'K2604100347139123',
    name: '胡******户',
    owner: '黄家颖',
    followUpBy: '陈敏',
    customerType: '零售商',
    mobileLevel: '-',
    annualAmount: '¥4500.00',
    autoLevel: '-',
    tags: '',
    region: '百慕大',
    createdAt: '2026-04-10 15:47:14',
    lastFollowAt: '-',
    lastOrderAt: '-',
  },
  {
    id: 'K2604090957213497',
    name: '胡******户',
    owner: '黄家颖',
    followUpBy: '-',
    customerType: '零售商',
    mobileLevel: '-',
    annualAmount: '¥14502.00',
    autoLevel: '-',
    tags: '',
    region: '爱沙尼亚',
    createdAt: '2026-04-09 09:57:21',
    lastFollowAt: '-',
    lastOrderAt: '-',
  },
  {
    id: 'K2604081043201104',
    name: '独******8',
    owner: '孙杰',
    followUpBy: '-',
    customerType: '零售商',
    mobileLevel: '-',
    annualAmount: '¥9212.00',
    autoLevel: '-',
    tags: '',
    region: '阿富汗',
    createdAt: '2026-04-08 10:43:21',
    lastFollowAt: '-',
    lastOrderAt: '2026-04-08 11:22:53',
  },
  {
    id: 'K2604070512426623',
    name: '胡******户',
    owner: '孙杰',
    followUpBy: '-',
    customerType: '零售商',
    mobileLevel: '-',
    annualAmount: '¥22778.00',
    autoLevel: '-',
    tags: '',
    region: '阿富汗',
    createdAt: '2026-04-07 17:12:42',
    lastFollowAt: '-',
    lastOrderAt: '-',
  },
  {
    id: 'K2604060832484355',
    name: '样*兰',
    owner: '王雄斌',
    followUpBy: '-',
    customerType: '未知',
    mobileLevel: '-',
    annualAmount: '¥1320.00',
    autoLevel: '-',
    tags: '',
    region: '中国',
    createdAt: '2026-04-06 20:32:48',
    lastFollowAt: '-',
    lastOrderAt: '-',
  },
  {
    id: 'K2604030452538637',
    name: 'V*********号',
    owner: '季智慧',
    followUpBy: '陈小怡',
    customerType: '零售商',
    mobileLevel: '-',
    annualAmount: '¥120.00',
    autoLevel: '-',
    tags: '',
    region: '中国',
    createdAt: '2026-04-03 16:52:53',
    lastFollowAt: '-',
    lastOrderAt: '-',
  },
  {
    id: 'K260403302089524',
    name: 'Q*******e',
    owner: '方文龙',
    followUpBy: '-',
    customerType: '零售商',
    mobileLevel: '-',
    annualAmount: '¥112.00',
    autoLevel: '-',
    tags: '',
    region: '美国',
    createdAt: '2026-04-03 15:02:08',
    lastFollowAt: '-',
    lastOrderAt: '-',
  },
];

function toCustomerRow(row: Record<string, unknown>): CustomerRow {
  return {
    id: String(row.id || ''),
    name: String(row.name || ''),
    owner: String(row.owner || ''),
    followUpBy: String(row.followUpBy || row.follow_up_by || ''),
    customerType: String(row.customerType || row.customer_type || ''),
    mobileLevel: String(row.mobileLevel || row.mobile_level || '-'),
    annualAmount: String(row.annualAmount || row.annual_amount || ''),
    autoLevel: String(row.autoLevel || row.auto_level || '-'),
    tags: String(row.tags || ''),
    region: String(row.region || ''),
    createdAt: String(row.createdAt || row.created_at || ''),
    lastFollowAt: String(row.lastFollowAt || row.last_follow_at || '-'),
    lastOrderAt: String(row.lastOrderAt || row.last_order_at || '-'),
  };
}

const Component = forwardRef<AxureHandle, AxureProps>(function CrmCustomerList(innerProps, ref) {
  const dataSource = innerProps?.data || {};
  const configSource = innerProps?.config || {};
  const onEventHandler = typeof innerProps?.onEvent === 'function' ? innerProps.onEvent : () => undefined;

  const operatorName =
    typeof configSource.operator_name === 'string' && configSource.operator_name
      ? configSource.operator_name
      : '阿塔咪';

  const initialCustomers = Array.isArray(dataSource.customers)
    ? dataSource.customers.map((item) => toCustomerRow(item as Record<string, unknown>))
    : DEFAULT_CUSTOMERS;

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [country, setCountry] = useState('');
  const [appliedCustomerCode, setAppliedCustomerCode] = useState('');
  const [appliedCustomerName, setAppliedCustomerName] = useState('');
  const [appliedCountry, setAppliedCountry] = useState('');

  const filteredCustomers = initialCustomers.filter((item) => {
    const codeMatched = appliedCustomerCode ? item.id.includes(appliedCustomerCode.trim()) : true;
    const nameMatched = appliedCustomerName ? item.name.includes(appliedCustomerName.trim()) : true;
    const countryMatched = appliedCountry ? item.region === appliedCountry : true;
    return codeMatched && nameMatched && countryMatched;
  });

  function emitEvent(name: string, payload?: Record<string, unknown>) {
    try {
      onEventHandler(name, payload ? JSON.stringify(payload) : undefined);
    } catch (error) {
      console.warn(`event ${name} failed`, error);
    }
  }

  function handleSearch() {
    setAppliedCustomerCode(customerCode);
    setAppliedCustomerName(customerName);
    setAppliedCountry(country);
    emitEvent('on_search', {
      customer_code: customerCode,
      customer_name: customerName,
      country,
    });
  }

  function handleReset() {
    setCustomerCode('');
    setCustomerName('');
    setCountry('');
    setAppliedCustomerCode('');
    setAppliedCustomerName('');
    setAppliedCountry('');
    emitEvent('on_reset');
  }

  function handleView(row: CustomerRow) {
    setSelectedCustomerId(row.id);
    emitEvent('on_view_customer', { customer_id: row.id, customer_name: row.name });
    if (typeof window !== 'undefined') {
      const targetUrl = `/prototypes/crm-customer-detail?id=${encodeURIComponent(row.id)}`;
      window.location.href = targetUrl;
    }
  }

  function handleDelete(row: CustomerRow) {
    emitEvent('on_delete_customer', { customer_id: row.id, customer_name: row.name });
  }

  useImperativeHandle(
    ref,
    () => ({
      getVar(name: string) {
        const vars: Record<string, unknown> = {
          selected_customer_id: selectedCustomerId,
          customer_count: filteredCustomers.length,
        };
        return vars[name];
      },
      fireAction(name: string) {
        if (name === 'reset_filters') {
          handleReset();
        }
      },
      eventList: EVENT_LIST,
      actionList: ACTION_LIST,
      varList: VAR_LIST,
      configList: CONFIG_LIST,
      dataList: DATA_LIST,
    }),
    [selectedCustomerId, filteredCustomers.length, customerCode, customerName, country],
  );

  return (
    <div className="crm-customer-list-shell">
      <div className="crm-customer-list-logo">
        <div className="crm-customer-list-logo-mark" aria-hidden="true">
          <span />
        </div>
        <span className="crm-customer-list-logo-text">CLEARAL</span>
      </div>

      <header className="crm-customer-list-topbar">
        <div className="crm-customer-list-topbar-left">
          <button className="crm-customer-list-icon-button" type="button" aria-label="打开菜单">
            <Menu size={16} />
          </button>
          <div className="crm-customer-list-breadcrumb">
            <span>销售管理</span>
            <ChevronRight size={12} />
            <span className="active">客户列表</span>
          </div>
        </div>

        <div className="crm-customer-list-topbar-right">
          <span className="crm-customer-list-operator">{operatorName}</span>
          <div className="crm-customer-list-avatar" aria-hidden="true">
            <span>咪</span>
          </div>
        </div>
      </header>

      <aside className="crm-customer-list-sidebar">
        <nav className="crm-customer-list-nav">
          {NAV_GROUPS.map((group) => (
            <div className="crm-customer-list-nav-group" key={group.label}>
              <button className="crm-customer-list-nav-parent" type="button">
                <span className="crm-customer-list-nav-parent-label">
                  {group.icon}
                  <span>{group.label}</span>
                </span>
                {group.items ? <ChevronDown size={12} /> : null}
              </button>

              {group.items ? (
                <div className="crm-customer-list-nav-children">
                  {group.items.map((item) => (
                    <button
                      className={`crm-customer-list-nav-child${item.active ? ' is-active' : ''}`}
                      key={item.label}
                      type="button"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </nav>
      </aside>

      <main className="crm-customer-list-main">
        <section className="crm-customer-list-tag-strip">
          {PAGE_TAGS.map((tag) => (
            <button
              className={`crm-customer-list-page-tag${tag === '客户列表' ? ' is-active' : ''}`}
              key={tag}
              type="button"
            >
              {tag}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </section>

        <section className="crm-customer-list-filter-card">
          <div className="crm-customer-list-filter-grid">
            <label className="crm-customer-list-field">
              <span>客户编号</span>
              <input
                placeholder="请输入"
                value={customerCode}
                onChange={(event) => setCustomerCode(event.target.value)}
              />
            </label>

            <label className="crm-customer-list-field">
              <span>客户名称</span>
              <input
                placeholder="请输入"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
              />
            </label>

            <label className="crm-customer-list-field">
              <span>归属</span>
              <select value={country} onChange={(event) => setCountry(event.target.value)}>
                <option value="">请选择</option>
                <option value="中国">中国</option>
                <option value="阿富汗">阿富汗</option>
                <option value="美国">美国</option>
                <option value="奥兰群岛">奥兰群岛</option>
              </select>
            </label>
          </div>

          <div className="crm-customer-list-filter-actions">
            <button className="crm-customer-list-primary-button" type="button" onClick={handleSearch}>
              <Search size={14} />
              搜索
            </button>
            <button className="crm-customer-list-secondary-button" type="button" onClick={handleReset}>
              <RefreshCcw size={14} />
              重置
            </button>
          </div>
        </section>

        <section className="crm-customer-list-table-card">
          <div className="crm-customer-list-table-header">
            <div className="crm-customer-list-table-header-left">
              <button
                className="crm-customer-list-primary-button"
                type="button"
                onClick={() => emitEvent('on_create_customer')}
              >
                <Plus size={14} />
                新增客户
              </button>
              <button className="crm-customer-list-secondary-button" type="button">
                自动客户层级规则
              </button>
            </div>

            <div className="crm-customer-list-table-header-right">
              <button className="crm-customer-list-round-button" type="button" aria-label="刷新表格">
                <RefreshCcw size={14} />
              </button>
              <button className="crm-customer-list-round-button" type="button" aria-label="更多">
                <CircleEllipsis size={14} />
              </button>
            </div>
          </div>

          <div className="crm-customer-list-table-wrap">
            <table className="crm-customer-list-table">
              <thead>
                <tr>
                  <th>客户编号</th>
                  <th>客户名称</th>
                  <th>归属</th>
                  <th>跟进人</th>
                  <th>客户类型</th>
                  <th>手动层级</th>
                  <th>近一年累计金额</th>
                  <th>自动层级</th>
                  <th>标签</th>
                  <th>国家地区</th>
                  <th>创建时间</th>
                  <th>最近跟进时间</th>
                  <th>最近下单时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td className="crm-customer-list-name-cell">
                      <span>{row.name}</span>
                    </td>
                    <td>{row.owner}</td>
                    <td>{row.followUpBy}</td>
                    <td>{row.customerType}</td>
                    <td>{row.mobileLevel}</td>
                    <td>{row.annualAmount}</td>
                    <td>{row.autoLevel}</td>
                    <td>
                      {row.tags ? (
                        <span className="crm-customer-list-tag-chip">{row.tags}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>{row.region}</td>
                    <td>{row.createdAt}</td>
                    <td>{row.lastFollowAt}</td>
                    <td>{row.lastOrderAt}</td>
                    <td>
                      <div className="crm-customer-list-actions">
                        <button type="button" onClick={() => handleView(row)}>
                          详情
                        </button>
                        <button className="danger" type="button" onClick={() => handleDelete(row)}>
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="crm-customer-list-pagination">
            <div className="crm-customer-list-pagination-total">共 {filteredCustomers.length} 条</div>
            <div className="crm-customer-list-pagination-controls">
              <button className="crm-customer-list-page-arrow" type="button">
                ‹
              </button>
              <button className="crm-customer-list-page-number is-active" type="button">
                1
              </button>
              <button className="crm-customer-list-page-number" type="button">
                2
              </button>
              <button className="crm-customer-list-page-number" type="button">
                3
              </button>
              <button className="crm-customer-list-page-number" type="button">
                4
              </button>
              <button className="crm-customer-list-page-number" type="button">
                5
              </button>
              <button className="crm-customer-list-page-arrow" type="button">
                ›
              </button>
              <select className="crm-customer-list-page-size" defaultValue="15条/页">
                <option>15条/页</option>
                <option>30条/页</option>
                <option>50条/页</option>
              </select>
              <div className="crm-customer-list-pagination-jump">
                前往
                <input defaultValue="1" />
                页
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="crm-customer-list-float-tools" aria-hidden="true">
        <div className="crm-customer-list-float-tool">✣</div>
        <div className="crm-customer-list-float-tool">A</div>
      </div>

      <div className="crm-customer-list-mobile-warning">
        当前页面主要按桌面管理后台比例还原，移动端会自动纵向排列以保证可读性。
      </div>
    </div>
  );
});

export default Component;
