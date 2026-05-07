/**
 * @name CRM 打板产品管理
 *
 * 参考资料：
 * - /rules/development-guide.md
 * - /src/prototypes/crm-presale-product/spec.md
 * - /src/docs/presale-product-business-states.md
 * - /src/database/proofing_products.json
 */

import './style.css';

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Factory,
  FileText,
  ImagePlus,
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  RefreshCcw,
  RotateCcw,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Upload,
  Users,
  Wallet,
  Warehouse,
  X,
} from 'lucide-react';

import ordersDb from '../../database/orders.json';
import proofingProductsDb from '../../database/proofing_products.json';
import type {
  Action,
  AxureHandle,
  AxureProps,
  ConfigItem,
  DataDesc,
  EventItem,
  KeyDesc,
} from '../../common/axure-types';

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

type CustomerRef = {
  customerId: string;
  customerName: string;
};

type SupplierRecord = {
  id: string;
  name: string;
  contact: string;
  phone: string;
};

type ProofingType = '内部开发' | '客户打板';
type ProofingStatus =
  | '待打板'
  | '打板中'
  | '待确认颜色'
  | '待收货'
  | '已收货'
  | '已转正品'
  | '已废弃';
type ConfirmationMethod = '寄实物' | '发照片';

type PostReceiptStatus = '未转正品' | '已转正品' | '已废弃';
type ReceiptStatus = '未收货' | '已收货';
type ShippingStatus = '未寄送' | '已寄送';
type LifecycleStage = Exclude<ProofingStatus, '已废弃' | '已转正品'>;
type ProductStatusFilter = '全部' | PostReceiptStatus;

type ProofingRecord = {
  id: string;
  category: string;
  image: string;
  requestDescription: string;
  expectedFinishDate: string;
  status: ProofingStatus;
  proofingType: ProofingType;
  customerId: string;
  customerName: string;
  proofingFee: string;
  supplierId: string;
  supplierName: string;
  supplierPrice: string;
  purchaseConfirmedAt: string;
  styleImage: string;
  styleConfirmedAt: string;
  colorImage: string;
  colorConfirmedAt: string;
  receivedAt: string;
  confirmationMethod: '' | ConfirmationMethod;
  courierCompany: string;
  trackingNumber: string;
  courierFee: string;
  gallery: string[];
  finalProductId: string;
  convertedAt: string;
  originalProofingId: string;
  reworkCount: number;
  createdAt: string;
  createdBy: string;
  note: string;
  customerShippedAt: string;
  postReceiptStatus: PostReceiptStatus;
  receivedBy: string;
};

type CreateFormState = {
  category: string;
  image: string;
  requestDescription: string;
  expectedFinishDate: string;
  proofingType: ProofingType;
  customerId: string;
  proofingFee: string;
  note: string;
};

type PurchaseFormState = {
  supplierId: string;
  supplierPrice: string;
};

type StyleConfirmFormState = {
  styleImage: string;
};

type ColorConfirmFormState = {
  colorImage: string;
  courierCompany: string;
  trackingNumber: string;
  courierFee: string;
};

type ConvertFormState = {
  gallery: string[];
};

type ShipToCustomerFormState = {
  courierCompany: string;
  trackingNumber: string;
  courierFee: string;
};

type RawRecord = Record<string, unknown>;

const PROOFING_STATUS_ORDER: ProofingStatus[] = [
  '待打板',
  '打板中',
  '待确认颜色',
  '待收货',
  '已收货',
  '已转正品',
  '已废弃',
];

const DISPLAY_TIMELINE: LifecycleStage[] = [
  '待打板',
  '打板中',
  '待确认颜色',
  '待收货',
  '已收货',
];

const STATUS_PILLS: Array<ProofingStatus | '全部'> = [
  '全部',
  '待打板',
  '打板中',
  '待确认颜色',
  '待收货',
  '已收货',
];

const PRODUCT_STATUS_OPTIONS: ProductStatusFilter[] = ['全部', '未转正品', '已转正品', '已废弃'];

const DEFAULT_CATEGORIES = ['皇冠', '项链', '耳环', '手链', '其他'];

const DEFAULT_SUPPLIERS: SupplierRecord[] = [
  { id: 'SUP001', name: '东莞金凯达五金制品厂', contact: '张经理', phone: '139****5678' },
  { id: 'SUP002', name: '义乌宏达饰品有限公司', contact: '李总', phone: '138****9012' },
  { id: 'SUP003', name: '深圳金艺珠宝有限公司', contact: '王主管', phone: '137****3456' },
];

const NAV_GROUPS: NavGroup[] = [
  { label: '仪表盘', icon: <LayoutDashboard size={14} /> },
  {
    label: '产品管理',
    icon: <Package size={14} />,
    items: [
      { label: '产品列表', icon: <Package size={13} /> },
      { label: '打板产品', icon: <ShoppingBag size={13} />, active: true },
      { label: '产品组合', icon: <Boxes size={13} /> },
      { label: '配钻列表', icon: <FileText size={13} /> },
    ],
  },
  {
    label: '销售管理',
    icon: <ShoppingBag size={14} />,
    items: [
      { label: '客户列表', icon: <Users size={13} /> },
      { label: '订单列表', icon: <FileText size={13} /> },
    ],
  },
  {
    label: '采购管理',
    icon: <ShoppingCart size={14} />,
    items: [
      { label: '已采购列表', icon: <FileText size={13} /> },
      { label: '供应商列表', icon: <Factory size={13} /> },
    ],
  },
  {
    label: '仓储管理',
    icon: <Warehouse size={14} />,
    items: [
      { label: '实时库存', icon: <Warehouse size={13} /> },
      { label: '入库列表', icon: <FileText size={13} /> },
      { label: '发货列表', icon: <Truck size={13} /> },
    ],
  },
  { label: '财务管理', icon: <Wallet size={14} /> },
  { label: '系统管理', icon: <Settings size={14} /> },
];

const EVENT_LIST: EventItem[] = [
  { name: 'on_select_proofing_product', desc: '选择打板产品时触发', payload: '打板ID' },
  { name: 'on_create_proofing_product', desc: '新建打板产品时触发', payload: '打板ID与打板类型' },
  { name: 'on_start_proofing_purchase', desc: '供应商确认并启动打板时触发', payload: '打板ID、供应商、打板价' },
  { name: 'on_advance_proofing_status', desc: '普通状态推进时触发', payload: '打板ID、起始状态、目标状态' },
  { name: 'on_confirm_proofing_style', desc: '确认样式时触发', payload: '打板ID与样式图片' },
  { name: 'on_confirm_proofing_color', desc: '确认颜色时触发', payload: '打板ID与颜色图片' },
  { name: 'on_mark_proofing_received', desc: '标记已收货时触发', payload: '打板ID' },
  { name: 'on_discard_proofing_product', desc: '废弃打板产品时触发', payload: '打板ID' },
  { name: 'on_rework_proofing_product', desc: '从废弃单发起重打时触发', payload: '原打板ID与新打板ID' },
  { name: 'on_ship_to_customer', desc: '寄送给客户时触发', payload: '打板ID、快递公司、运单号、快递费' },
  { name: 'on_convert_proofing_product', desc: '转正品时触发', payload: '打板ID与图库图片' },
  { name: 'on_select_category', desc: '切换分类时触发', payload: '分类名称' },
];

const ACTION_LIST: Action[] = [
  { name: 'refresh_list', desc: '重置分类、搜索与状态筛选' },
];

const VAR_LIST: KeyDesc[] = [
  { name: 'proofing_product_count', desc: '打板产品总数' },
  { name: 'pending_purchase_count', desc: '待供应商确认的打板产品数量' },
  { name: 'selected_proofing_id', desc: '当前选中的打板ID' },
  { name: 'selected_category', desc: '当前选中的分类' },
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
    name: 'proofing_products',
    desc: '打板产品数据，优先使用的新结构',
    keys: [
      { name: '打板ID', desc: '打板产品编号' },
      { name: '分类', desc: '产品分类' },
      { name: '打板类型', desc: '内部开发或客户打板' },
      { name: '需求描述', desc: '打板需求说明' },
      { name: '当前状态', desc: '打板生命周期状态' },
    ],
  },
  {
    name: 'presale_products',
    desc: '旧预售产品结构兼容输入，会自动折算为打板任务',
    keys: [
      { name: 'id', desc: '旧预售产品ID' },
      { name: '分类', desc: '产品分类' },
      { name: '规格列表', desc: '旧规格数组，会拆成多条打板记录' },
    ],
  },
];

const INITIAL_CREATE_FORM: CreateFormState = {
  category: '皇冠',
  image: '',
  requestDescription: '',
  expectedFinishDate: '',
  proofingType: '内部开发',
  customerId: '',
  proofingFee: '',
  note: '',
};

const INITIAL_PURCHASE_FORM: PurchaseFormState = {
  supplierId: 'SUP001',
  supplierPrice: '',
};

const INITIAL_STYLE_FORM: StyleConfirmFormState = {
  styleImage: '',
};

const INITIAL_COLOR_FORM: ColorConfirmFormState = {
  colorImage: '',
  courierCompany: '',
  trackingNumber: '',
  courierFee: '',
};

const INITIAL_CONVERT_FORM: ConvertFormState = {
  gallery: [],
};

const INITIAL_SHIP_TO_CUSTOMER_FORM: ShipToCustomerFormState = {
  courierCompany: '',
  trackingNumber: '',
  courierFee: '',
};

function getRawList(source: unknown): unknown[] {
  if (Array.isArray(source)) {
    return source;
  }
  if (source && typeof source === 'object' && Array.isArray((source as { records?: unknown[] }).records)) {
    return (source as { records: unknown[] }).records;
  }
  return [];
}

function normalizeProofingType(raw: unknown): ProofingType {
  const value = String(raw ?? '');
  return value === '客户打板' ? '客户打板' : '内部开发';
}

function normalizeProofingStatus(raw: unknown): ProofingStatus {
  const value = String(raw ?? '');
  if (value === '待确认样式') {
    return '打板中';
  }
  return PROOFING_STATUS_ORDER.includes(value as ProofingStatus) ? (value as ProofingStatus) : '待打板';
}

function toStringValue(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  return String(raw);
}

function toArrayOfStrings(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const record = item as RawRecord;
        return toStringValue(record.url ?? record.image ?? record.src);
      }
      return '';
    })
    .filter(Boolean);
}

function getCustomerList(): CustomerRef[] {
  const rawOrders = getRawList(ordersDb);
  const map = new Map<string, string>();
  rawOrders.forEach((item) => {
    const record = item as RawRecord;
    const customerId = toStringValue(record['客户编号'] ?? record.customerId ?? record.customer_id);
    const customerName = toStringValue(record['客户名称'] ?? record.customerName ?? record.customer_name);
    if (customerId && !map.has(customerId)) {
      map.set(customerId, customerName || customerId);
    }
  });
  return Array.from(map.entries()).map(([customerId, customerName]) => ({ customerId, customerName }));
}

function normalizeProofingRecord(raw: RawRecord): ProofingRecord {
  return {
    id: toStringValue(raw['打板ID'] ?? raw.id),
    category: toStringValue(raw['分类'] ?? raw.category) || '其他',
    image: toStringValue(raw['图片'] ?? raw.image),
    requestDescription: toStringValue(raw['需求描述'] ?? raw.requestDescription ?? raw.description),
    expectedFinishDate: toStringValue(raw['期望完成时间'] ?? raw.expectedFinishDate ?? raw.expected_finish_date),
    status: normalizeProofingStatus(raw['当前状态'] ?? raw.status),
    proofingType: normalizeProofingType(raw['打板类型'] ?? raw.proofingType ?? raw.proofing_type),
    customerId: toStringValue(raw['客户ID'] ?? raw.customerId ?? raw.customer_id),
    customerName: toStringValue(raw['客户名称'] ?? raw.customerName ?? raw.customer_name),
    proofingFee: toStringValue(raw['打板费用'] ?? raw.proofingFee ?? raw.proofing_fee),
    supplierId: toStringValue(raw['供应商ID'] ?? raw.supplierId ?? raw.supplier_id),
    supplierName: toStringValue(raw['供应商名称'] ?? raw.supplierName ?? raw.supplier_name),
    supplierPrice: toStringValue(raw['供应商打板价'] ?? raw.supplierPrice ?? raw.supplier_price),
    purchaseConfirmedAt: toStringValue(raw['采购确认时间'] ?? raw.purchaseConfirmedAt ?? raw.purchase_confirmed_at),
    styleImage: toStringValue(raw['样式图片'] ?? raw.styleImage ?? raw.style_image),
    styleConfirmedAt: toStringValue(raw['样式确认时间'] ?? raw.styleConfirmedAt ?? raw.style_confirmed_at),
    colorImage: toStringValue(raw['颜色图片'] ?? raw.colorImage ?? raw.color_image),
    colorConfirmedAt: toStringValue(raw['颜色确认时间'] ?? raw.colorConfirmedAt ?? raw.color_confirmed_at),
    receivedAt: toStringValue(raw['收货时间'] ?? raw.receivedAt ?? raw.received_at),
    confirmationMethod: (() => {
      const value = toStringValue(raw['确认方式'] ?? raw.confirmationMethod ?? raw.confirmation_method);
      return value === '寄实物' || value === '发照片' ? value : '';
    })(),
    courierCompany: toStringValue(raw['快递公司'] ?? raw.courierCompany ?? raw.courier_company),
    trackingNumber: toStringValue(raw['运单号'] ?? raw.trackingNumber ?? raw.tracking_number),
    courierFee: toStringValue(raw['快递费'] ?? raw.courierFee ?? raw.courier_fee),
    gallery: toArrayOfStrings(raw['图库'] ?? raw.gallery),
    finalProductId: toStringValue(raw['正品产品ID'] ?? raw.finalProductId ?? raw.final_product_id),
    convertedAt: toStringValue(raw['转正时间'] ?? raw.convertedAt ?? raw.converted_at),
    originalProofingId: toStringValue(raw['原打板ID'] ?? raw.originalProofingId ?? raw.original_proofing_id),
    reworkCount: Number(raw['重打次数'] ?? raw.reworkCount ?? raw.rework_count ?? 0) || 0,
    createdAt: toStringValue(raw['创建时间'] ?? raw.createdAt ?? raw.created_at),
    createdBy: toStringValue(raw['创建人'] ?? raw.createdBy ?? raw.created_by),
    note: toStringValue(raw['备注'] ?? raw.note),
    customerShippedAt: toStringValue(raw['寄送客户时间'] ?? raw.customerShippedAt ?? raw.customer_shipped_at),
    receivedBy: toStringValue(raw['收货操作人'] ?? raw.receivedBy ?? raw.received_by),
    postReceiptStatus: (() => {
      const value = toStringValue(raw['后置状态'] ?? raw.postReceiptStatus ?? raw.post_receipt_status);
      return value === '已转正品' || value === '已废弃' ? value : '未转正品';
    })(),
  };
}

function normalizeLegacyStatus(raw: unknown): ProofingStatus {
  const value = String(raw ?? '');
  switch (value) {
    case '待打板':
      return '待打板';
    case '打板中':
      return '打板中';
    case '已打板':
      return '打板中';
    case '已确认':
      return '已收货';
    case '已转正品':
      return '已转正品';
    case '已废弃':
      return '已废弃';
    default:
      return '待打板';
  }
}

function normalizeLegacyPresaleProducts(source: unknown): ProofingRecord[] {
  const rawList = getRawList(source);
  const result: ProofingRecord[] = [];

  rawList.forEach((item) => {
    const product = item as RawRecord;
    const category = toStringValue(product['分类'] ?? product.category) || '其他';
    const image = toStringValue(product['设计图'] ?? product.designImage ?? product.image);
    const supplierId = toStringValue(product['供应商编号'] ?? product.supplierId);
    const supplierName = toStringValue(product['供应商名称'] ?? product.supplierName);
    const createdAt = toStringValue(product['创建日期'] ?? product.createdDate);
    const createdBy = toStringValue(product['创建人'] ?? product.createdBy);
    const note = toStringValue(product['备注'] ?? product.note);
    const specs = getRawList(product['规格列表'] ?? product.specs);

    if (specs.length === 0) {
      result.push({
        id: `${toStringValue(product.id)}-LEGACY`,
        category,
        image,
        requestDescription: note || '旧预售产品兼容导入',
        expectedFinishDate: '',
        status: '待打板',
        proofingType: '内部开发',
        customerId: '',
        customerName: '',
        proofingFee: '',
        supplierId,
        supplierName,
        supplierPrice: '',
        purchaseConfirmedAt: '',
        styleImage: '',
        styleConfirmedAt: '',
        colorImage: '',
        colorConfirmedAt: '',
        receivedAt: '',
        confirmationMethod: '',
        courierCompany: '',
        trackingNumber: '',
        courierFee: '',
        gallery: [],
        finalProductId: '',
        convertedAt: '',
        originalProofingId: '',
        reworkCount: 0,
        createdAt,
        createdBy,
        note,
        customerShippedAt: '',
        receivedBy: '',
        postReceiptStatus: '未转正品',
      });
      return;
    }

    specs.forEach((spec, index) => {
      const specRecord = spec as RawRecord;
      const linkedCustomers = getRawList(specRecord['关联客户'] ?? specRecord.linkedCustomers);
      const firstCustomer = linkedCustomers[0] as RawRecord | undefined;
      const customerId = toStringValue(firstCustomer?.['客户编号'] ?? firstCustomer?.customerId);
      const customerName = toStringValue(firstCustomer?.['客户名称'] ?? firstCustomer?.customerName);
      const requestParts = [
        toStringValue(specRecord['电镀颜色'] ?? specRecord.platingColor),
        toStringValue(specRecord['颜色名称'] ?? specRecord.colorName),
        toStringValue(specRecord['规格描述'] ?? specRecord.description),
      ].filter(Boolean);

      result.push({
        id: `${toStringValue(product.id)}-${toStringValue(specRecord.id) || String(index + 1).padStart(3, '0')}`,
        category,
        image: toStringValue(specRecord['图片'] ?? specRecord.image) || image,
        requestDescription: requestParts.join(' / ') || note || '旧预售产品兼容导入',
        expectedFinishDate: toStringValue(specRecord['预计完成日期'] ?? specRecord.estimatedCompletionDate),
        status: normalizeLegacyStatus(specRecord['打板状态'] ?? specRecord.proofingStatus),
        proofingType: customerId ? '客户打板' : '内部开发',
        customerId,
        customerName,
        proofingFee: '',
        supplierId,
        supplierName,
        supplierPrice: '',
        purchaseConfirmedAt: createdAt,
        styleImage: '',
        styleConfirmedAt: '',
        colorImage: '',
        colorConfirmedAt: '',
        receivedAt: '',
        confirmationMethod: '',
        courierCompany: '',
        trackingNumber: '',
        courierFee: '',
        gallery: [],
        finalProductId: '',
        convertedAt: '',
        originalProofingId: '',
        reworkCount: 0,
        createdAt,
        createdBy,
        note,
        customerShippedAt: '',
        receivedBy: '',
        postReceiptStatus: '未转正品',
      });
    });
  });

  return result;
}

function normalizeIncomingProducts(primary: unknown, legacy: unknown): ProofingRecord[] {
  const nextPrimary = getRawList(primary)
    .map((item) => (item && typeof item === 'object' ? normalizeProofingRecord(item as RawRecord) : null))
    .filter((item): item is ProofingRecord => Boolean(item?.id));

  if (nextPrimary.length > 0) {
    return nextPrimary;
  }

  const legacyItems = normalizeLegacyPresaleProducts(legacy);
  if (legacyItems.length > 0) {
    return legacyItems;
  }

  return getRawList(proofingProductsDb)
    .map((item) => normalizeProofingRecord(item as RawRecord))
    .filter((item) => Boolean(item.id));
}

function getLifecycleStatusBadgeClass(status: ProofingStatus): string {
  switch (status) {
    case '待打板':
      return 'is-pending-proof';
    case '打板中':
      return 'is-proofing';
    case '待确认颜色':
      return 'is-color-review';
    case '待收货':
      return 'is-pending-receive';
    case '已收货':
      return 'is-received';
    case '已转正品':
      return 'is-converted';
    case '已废弃':
      return 'is-discarded';
    default:
      return '';
  }
}

function getReceiptStatus(record: ProofingRecord): ReceiptStatus {
  return record.status === '已收货' ? '已收货' : '未收货';
}

function getReceiptStatusBadgeClass(status: ReceiptStatus): string {
  return status === '已收货' ? 'is-received' : 'is-pending-receive';
}

function getProductStatusBadgeClass(status: PostReceiptStatus): string {
  switch (status) {
    case '已转正品':
      return 'is-converted';
    case '已废弃':
      return 'is-discarded';
    default:
      return 'is-not-converted';
  }
}

function getShippingStatus(record: ProofingRecord): ShippingStatus {
  return record.customerShippedAt ? '已寄送' : '未寄送';
}

function getShippingStatusBadgeClass(status: ShippingStatus): string {
  return status === '已寄送' ? 'is-shipped' : 'is-pending-proof';
}

function isReceiptStageRecord(record: ProofingRecord): boolean {
  return record.status === '待收货' || record.status === '已收货';
}

function canMarkReceived(record: ProofingRecord): boolean {
  return record.status === '待收货' && record.postReceiptStatus !== '已废弃';
}

function canConvert(record: ProofingRecord): boolean {
  return record.postReceiptStatus === '未转正品';
}

function canDiscard(record: ProofingRecord): boolean {
  return isReceiptStageRecord(record) && record.postReceiptStatus === '未转正品';
}

function canRework(record: ProofingRecord): boolean {
  return record.postReceiptStatus === '已废弃' || record.status === '已废弃';
}

function canShipToCustomer(record: ProofingRecord): boolean {
  return record.status === '已收货' && record.proofingType === '客户打板' && !record.customerShippedAt && record.postReceiptStatus !== '已废弃';
}

function hasShippedToCustomer(record: ProofingRecord): boolean {
  return record.proofingType === '客户打板' && Boolean(record.customerShippedAt);
}

function shouldShowReceiptStatus(record: ProofingRecord): boolean {
  return isReceiptStageRecord(record);
}

function getCurrentLifecycleStage(record: ProofingRecord): LifecycleStage {
  if (record.status === '已收货' || Boolean(record.receivedAt)) return '已收货';
  if (record.status === '待收货' || Boolean(record.colorConfirmedAt)) return '待收货';
  if (record.status === '待确认颜色' || Boolean(record.styleConfirmedAt)) return '待确认颜色';
  if (record.status === '打板中' || Boolean(record.purchaseConfirmedAt)) return '打板中';
  return '待打板';
}

function getTimelineSummary(record: ProofingRecord, status: LifecycleStage): string {
  switch (status) {
    case '待打板':
      return record.supplierName ? `供应商已确认 ${record.purchaseConfirmedAt}` : '待确认供应商与打板价';
    case '打板中':
      return record.styleConfirmedAt ? `样式已确认 ${record.styleConfirmedAt}` : '待确认样式图片';
    case '待确认颜色':
      return record.colorConfirmedAt ? `颜色已确认 ${record.colorConfirmedAt}` : '待上传颜色图片';
    case '待收货':
      return record.receivedAt ? `${record.receivedBy || '-'} 已收货 ${record.receivedAt}` : (record.confirmationMethod ? `${record.confirmationMethod}回寄中` : '待供应商寄回样品');
    case '已收货':
      return record.proofingType === '客户打板'
        ? record.customerShippedAt
          ? `已寄送客户 ${record.customerShippedAt}`
          : '待寄送客户'
        : record.receivedAt || '已完成收货';
    default:
      return '-';
  }
}

function renderTimelineStageDetail(
  record: ProofingRecord,
  status: LifecycleStage,
  onPreviewImage: (image: string) => void,
): React.ReactNode {
  if (status === '待打板') {
    return (
      <div className="crm-presale-product-timeline-detail-card">
        <div className="crm-presale-product-timeline-detail-grid">
          <div className="timeline-detail-item">
            <span>供应商</span>
            <strong>{record.supplierName || '待分配'}</strong>
          </div>
          <div className="timeline-detail-item">
            <span>打板价</span>
            <strong>{record.supplierPrice ? formatMoney(record.supplierPrice) : '-'}</strong>
          </div>
          <div className="timeline-detail-item">
            <span>确认状态</span>
            <strong>{record.purchaseConfirmedAt ? '已确认' : '待确认'}</strong>
          </div>
          <div className="timeline-detail-item">
            <span>确认时间</span>
            <strong>{record.purchaseConfirmedAt || '-'}</strong>
          </div>
        </div>
      </div>
    );
  }

  if (status === '打板中') {
    return (
      <div className="crm-presale-product-timeline-detail-card is-image">
        <div className="timeline-detail-image-card">
          {record.styleImage ? (
            <button
              className="timeline-detail-image-button"
              type="button"
              onClick={() => onPreviewImage(record.styleImage)}
              aria-label="放大查看样式图片"
            >
              <img alt="时间轴样式图片" src={record.styleImage} onError={handleImgError} />
            </button>
          ) : (
            <div className="image-empty">待上传样式图</div>
          )}
        </div>
      </div>
    );
  }

  if (status === '待确认颜色') {
    return (
      <div className="crm-presale-product-timeline-detail-card is-image">
        <div className="timeline-detail-image-card">
          {record.colorImage ? (
            <button
              className="timeline-detail-image-button"
              type="button"
              onClick={() => onPreviewImage(record.colorImage)}
              aria-label="放大查看颜色图片"
            >
              <img alt="时间轴颜色图片" src={record.colorImage} onError={handleImgError} />
            </button>
          ) : (
            <div className="image-empty">待上传颜色图</div>
          )}
        </div>
      </div>
    );
  }

  if (status === '待收货' || status === '已收货') {
    return null;
  }

  return null;
}

function formatDateTime(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function formatMoney(value: string): string {
  if (!value) return '-';
  return `¥${value}`;
}

function generateProofingId(records: ProofingRecord[]): string {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const sameMonth = records.filter((item) => item.id.startsWith(`DB${ym}`));
  return `DB${ym}${String(sameMonth.length + 1).padStart(3, '0')}`;
}

function buildCategoryFallbackImage(category: string, label: string): string {
  const configs: Record<string, { start: string; end: string; icon: string }> = {
    皇冠: { start: '#d97706', end: '#fbbf24', icon: 'crown' },
    项链: { start: '#2563eb', end: '#60a5fa', icon: 'necklace' },
    耳环: { start: '#db2777', end: '#f472b6', icon: 'earring' },
    手链: { start: '#059669', end: '#34d399', icon: 'bracelet' },
  };
  const cfg = configs[category] || { start: '#7c3aed', end: '#a78bfa', icon: 'gem' };

  let iconSvg = '';
  switch (cfg.icon) {
    case 'crown':
      iconSvg = `
        <path d="M24 58 L72 58 L68 38 L52 46 L48 26 L44 46 L28 38 Z" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
        <circle cx="48" cy="34" r="3" fill="rgba(255,255,255,0.6)"/>
        <circle cx="32" cy="42" r="2.5" fill="rgba(255,255,255,0.4)"/>
        <circle cx="64" cy="42" r="2.5" fill="rgba(255,255,255,0.4)"/>
      `;
      break;
    case 'necklace':
      iconSvg = `
        <path d="M28 30 Q48 60 68 30" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
        <polygon points="48,48 42,58 48,66 54,58" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
      `;
      break;
    case 'earring':
      iconSvg = `
        <circle cx="40" cy="32" r="4" fill="rgba(255,255,255,0.4)"/>
        <circle cx="56" cy="32" r="4" fill="rgba(255,255,255,0.4)"/>
        <line x1="40" y1="36" x2="40" y2="52" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
        <line x1="56" y1="36" x2="56" y2="52" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
        <ellipse cx="40" cy="58" rx="5" ry="8" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
        <ellipse cx="56" cy="58" rx="5" ry="8" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
      `;
      break;
    case 'bracelet':
      iconSvg = `
        <ellipse cx="48" cy="52" rx="22" ry="14" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2.5"/>
        <ellipse cx="48" cy="52" rx="14" ry="9" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
      `;
      break;
    default:
      iconSvg = `
        <polygon points="48,28 58,44 48,60 38,44" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
        <line x1="48" y1="28" x2="48" y2="60" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
        <line x1="38" y1="44" x2="58" y2="44" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
      `;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${cfg.start}" />
          <stop offset="100%" stop-color="${cfg.end}" />
        </linearGradient>
        <linearGradient id="sh" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.35)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0.05)" />
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="22" fill="url(#g)" />
      <rect width="96" height="96" rx="22" fill="url(#sh)" />
      ${iconSvg}
      <text x="48" y="82" text-anchor="middle" font-size="11" font-family="Arial, sans-serif" fill="#ffffff" font-weight="700">${label}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getRecordImage(record: ProofingRecord): string {
  if (record.image) return record.image;
  return buildCategoryFallbackImage(record.category, record.id.slice(-3) || 'DB');
}

function handleImgError(event: React.SyntheticEvent<HTMLImageElement>) {
  const target = event.currentTarget;
  target.src = buildCategoryFallbackImage('其他', target.alt);
  target.onerror = null;
}

function getStageCompletedIndex(record: ProofingRecord): number {
  return DISPLAY_TIMELINE.indexOf(getCurrentLifecycleStage(record));
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

type SingleImageUploaderProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
};

function SingleImageUploader({ label, value, onChange, hint }: SingleImageUploaderProps) {
  return (
    <div className="crm-presale-product-upload-field">
      <span className="crm-presale-product-upload-label">{label}</span>
      <label className="crm-presale-product-upload-panel">
        {value ? (
          <img alt={label} className="crm-presale-product-upload-preview" src={value} />
        ) : (
          <span className="crm-presale-product-upload-placeholder">
            <ImagePlus size={18} />
            <span>{hint || '点击上传图片'}</span>
          </span>
        )}
        <input
          accept="image/*"
          className="crm-presale-product-upload-input"
          type="file"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const input = event.currentTarget;
            const nextValue = await readFileAsDataUrl(file);
            onChange(nextValue);
            input.value = '';
          }}
        />
      </label>
    </div>
  );
}

type MultiImageUploaderProps = {
  value: string[];
  onChange: (value: string[]) => void;
};

function MultiImageUploader({ value, onChange }: MultiImageUploaderProps) {
  return (
    <div className="crm-presale-product-upload-field">
      <span className="crm-presale-product-upload-label">图库</span>
      <label className="crm-presale-product-gallery-upload">
        <Upload size={16} />
        <span>上传图库</span>
        <input
          accept="image/*"
          className="crm-presale-product-upload-input"
          multiple
          type="file"
          onChange={async (event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length === 0) return;
            const input = event.currentTarget;
            const nextImages = await Promise.all(files.map((file) => readFileAsDataUrl(file)));
            onChange([...value, ...nextImages]);
            input.value = '';
          }}
        />
      </label>
      {value.length > 0 ? (
        <div className="crm-presale-product-gallery-grid">
          {value.map((image, index) => (
            <div className="crm-presale-product-gallery-item" key={`${image.slice(0, 20)}-${index}`}>
              <img alt={`图库 ${index + 1}`} src={image} />
              <button
                className="crm-presale-product-gallery-remove"
                type="button"
                onClick={() => onChange(value.filter((_, currentIndex) => currentIndex !== index))}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const Component = forwardRef<AxureHandle, AxureProps>(function CrmPresaleProduct(props, ref) {
  const { data, config, onEvent } = props;
  const operatorName = String(config?.operator_name ?? '阿塔咪');

  const customers = useMemo(() => getCustomerList(), []);
  const customerMap = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach((customer) => {
      map.set(customer.customerId, customer.customerName);
    });
    return map;
  }, [customers]);

  const incomingProducts = useMemo(
    () => normalizeIncomingProducts(data?.proofing_products, data?.presale_products),
    [data?.proofing_products, data?.presale_products],
  );

  const [proofingProducts, setProofingProducts] = useState<ProofingRecord[]>(incomingProducts);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [statusFilter, setStatusFilter] = useState<ProofingStatus | '全部'>('全部');
  const [productStatusFilter, setProductStatusFilter] = useState<ProductStatusFilter>('全部');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedProofingId, setSelectedProofingId] = useState('');
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showShipToCustomerModal, setShowShipToCustomerModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [discardTargetId, setDiscardTargetId] = useState('');
  const [receiveTargetId, setReceiveTargetId] = useState('');
  const [shipToCustomerTargetId, setShipToCustomerTargetId] = useState('');
  const [createForm, setCreateForm] = useState<CreateFormState>(INITIAL_CREATE_FORM);
  const [purchaseForm, setPurchaseForm] = useState<PurchaseFormState>(INITIAL_PURCHASE_FORM);
  const [styleForm, setStyleForm] = useState<StyleConfirmFormState>(INITIAL_STYLE_FORM);
  const [colorForm, setColorForm] = useState<ColorConfirmFormState>(INITIAL_COLOR_FORM);
  const [convertForm, setConvertForm] = useState<ConvertFormState>(INITIAL_CONVERT_FORM);
  const [shipToCustomerForm, setShipToCustomerForm] = useState<ShipToCustomerFormState>(INITIAL_SHIP_TO_CUSTOMER_FORM);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    setProofingProducts(incomingProducts);
  }, [incomingProducts]);

  useEffect(() => {
    if (selectedCategory !== '全部' && !proofingProducts.some((item) => item.category === selectedCategory)) {
      setSelectedCategory('全部');
    }
  }, [proofingProducts, selectedCategory]);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timer = window.setTimeout(() => setToastMessage(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const categories = useMemo(() => {
    const merged = [...DEFAULT_CATEGORIES];
    proofingProducts.forEach((item) => {
      if (item.category && !merged.includes(item.category)) {
        merged.push(item.category);
      }
    });
    return merged;
  }, [proofingProducts]);

  const pendingPurchaseCount = useMemo(
    () => proofingProducts.filter((item) => item.status === '待打板').length,
    [proofingProducts],
  );

  const activeCategorySource = useMemo(() => proofingProducts, [proofingProducts]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 全部: activeCategorySource.length };
    categories.forEach((category) => {
      counts[category] = activeCategorySource.filter((item) => item.category === category).length;
    });
    return counts;
  }, [activeCategorySource, categories]);

  const statusCounts = useMemo(() => {
    const scopedProducts =
      selectedCategory === '全部'
        ? proofingProducts
        : proofingProducts.filter((item) => item.category === selectedCategory);
    const counts: Record<string, number> = { 全部: scopedProducts.length };
    PROOFING_STATUS_ORDER.forEach((status) => {
      counts[status] = scopedProducts.filter((item) => item.status === status).length;
    });
    return counts;
  }, [proofingProducts, selectedCategory]);

  const filteredProducts = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    return proofingProducts
      .filter((item) => {
        if (selectedCategory !== '全部' && item.category !== selectedCategory) return false;
        if (statusFilter !== '全部' && item.status !== statusFilter) {
          return false;
        }
        if (productStatusFilter !== '全部' && item.postReceiptStatus !== productStatusFilter) {
          return false;
        }
        if (!keyword) return true;
        const haystack = [
          item.id,
          item.category,
          item.requestDescription,
          item.customerName,
          item.supplierName,
          item.finalProductId,
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(keyword);
      })
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [proofingProducts, searchKeyword, selectedCategory, statusFilter, productStatusFilter]);

  const selectedRecord = useMemo(
    () => proofingProducts.find((item) => item.id === selectedProofingId) ?? null,
    [proofingProducts, selectedProofingId],
  );

  const emitEvent = (name: string, payload: Record<string, unknown>) => {
    onEvent?.(name, JSON.stringify(payload));
  };

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  const resetFilters = () => {
    setSelectedCategory('全部');
    setStatusFilter('全部');
    setProductStatusFilter('全部');
    setSearchKeyword('');
  };

  const updateProduct = (targetId: string, updater: (record: ProofingRecord) => ProofingRecord) => {
    setProofingProducts((current) =>
      current.map((item) => (item.id === targetId ? updater(item) : item)),
    );
  };

  const openDetailDrawer = (recordId: string) => {
    setSelectedProofingId(recordId);
    setShowDetailDrawer(true);
    emitEvent('on_select_proofing_product', { proofing_id: recordId });
  };

  const closeAllActionModals = () => {
    setShowPurchaseModal(false);
    setShowStyleModal(false);
    setShowColorModal(false);
    setShowShipToCustomerModal(false);
    setShowConvertModal(false);
    setDiscardTargetId('');
    setReceiveTargetId('');
    setShipToCustomerTargetId('');
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    emitEvent('on_select_category', { category });
  };

  const openPurchaseModal = (record: ProofingRecord) => {
    setSelectedProofingId(record.id);
    setPurchaseForm({
      supplierId: record.supplierId || DEFAULT_SUPPLIERS[0]?.id || '',
      supplierPrice: record.supplierPrice,
    });
    setShowPurchaseModal(true);
  };

  const openStyleModal = (record: ProofingRecord) => {
    setSelectedProofingId(record.id);
    setStyleForm({ styleImage: record.styleImage });
    setShowStyleModal(true);
  };

  const openColorModal = (record: ProofingRecord) => {
    setSelectedProofingId(record.id);
    setColorForm({
      colorImage: record.colorImage,
      courierCompany: '',
      trackingNumber: '',
      courierFee: '',
    });
    setShowColorModal(true);
  };

  const openShipToCustomerModal = (record: ProofingRecord) => {
    setSelectedProofingId(record.id);
    setShipToCustomerForm({
      courierCompany: record.courierCompany || '',
      trackingNumber: record.trackingNumber || '',
      courierFee: record.courierFee || '',
    });
    setShowShipToCustomerModal(true);
  };

  const openConvertModal = (record: ProofingRecord) => {
    setSelectedProofingId(record.id);
    setConvertForm({
      gallery: record.gallery,
    });
    setShowConvertModal(true);
  };

  const handleCreateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!createForm.image) {
      showToast('请先上传打板图片');
      return;
    }
    if (!createForm.requestDescription.trim()) {
      showToast('请输入需求描述');
      return;
    }
    if (!createForm.expectedFinishDate) {
      showToast('请选择期望完成时间');
      return;
    }
    if (createForm.proofingType === '客户打板') {
      if (!createForm.customerId) {
        showToast('客户打板需要选择客户');
        return;
      }
      if (!createForm.proofingFee) {
        showToast('客户打板需要填写打板费用');
        return;
      }
    }

    const nextId = generateProofingId(proofingProducts);
    const nextRecord: ProofingRecord = {
      id: nextId,
      category: createForm.category,
      image: createForm.image,
      requestDescription: createForm.requestDescription.trim(),
      expectedFinishDate: createForm.expectedFinishDate,
      status: '待打板',
      proofingType: createForm.proofingType,
      customerId: createForm.proofingType === '客户打板' ? createForm.customerId : '',
      customerName: createForm.proofingType === '客户打板' ? customerMap.get(createForm.customerId) || '' : '',
      proofingFee: createForm.proofingType === '客户打板' ? createForm.proofingFee : '',
      supplierId: '',
      supplierName: '',
      supplierPrice: '',
      purchaseConfirmedAt: '',
      styleImage: '',
      styleConfirmedAt: '',
      colorImage: '',
      colorConfirmedAt: '',
      receivedAt: '',
      confirmationMethod: '',
      courierCompany: '',
      trackingNumber: '',
      courierFee: '',
      gallery: [],
      finalProductId: '',
      convertedAt: '',
      originalProofingId: '',
      reworkCount: 0,
      createdAt: formatDateTime(),
      createdBy: operatorName,
      note: createForm.note.trim(),
      customerShippedAt: '',
      receivedBy: '',
      postReceiptStatus: '未转正品',
    };

    setProofingProducts((current) => [nextRecord, ...current]);
    setCreateForm(INITIAL_CREATE_FORM);
    setShowCreateModal(false);
    setSelectedProofingId(nextId);
    emitEvent('on_create_proofing_product', {
      proofing_id: nextId,
      proofing_type: nextRecord.proofingType,
    });
    showToast(`打板产品 ${nextId} 已创建`);
  };

  const handlePurchaseSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRecord) return;
    if (!purchaseForm.supplierId) {
      showToast('请选择供应商');
      return;
    }
    if (!purchaseForm.supplierPrice) {
      showToast('请输入供应商打板价');
      return;
    }
    const supplier = DEFAULT_SUPPLIERS.find((item) => item.id === purchaseForm.supplierId);
    updateProduct(selectedRecord.id, (current) => ({
      ...current,
      supplierId: purchaseForm.supplierId,
      supplierName: supplier?.name || purchaseForm.supplierId,
      supplierPrice: purchaseForm.supplierPrice,
      purchaseConfirmedAt: formatDateTime(),
      status: '打板中',
    }));
    emitEvent('on_start_proofing_purchase', {
      proofing_id: selectedRecord.id,
      supplier_id: purchaseForm.supplierId,
      supplier_name: supplier?.name || purchaseForm.supplierId,
      supplier_price: purchaseForm.supplierPrice,
    });
    closeAllActionModals();
    showToast(`打板单 ${selectedRecord.id} 已进入打板中`);
  };

  const handleStyleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRecord) return;
    updateProduct(selectedRecord.id, (current) => ({
      ...current,
      styleImage: styleForm.styleImage,
      styleConfirmedAt: formatDateTime(),
      status: '待确认颜色',
    }));
    emitEvent('on_confirm_proofing_style', {
      proofing_id: selectedRecord.id,
      style_image: styleForm.styleImage,
    });
    closeAllActionModals();
    showToast(`打板单 ${selectedRecord.id} 已完成样式确认`);
  };

  const handleColorSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRecord) return;
    if (!colorForm.colorImage) {
      showToast('请上传颜色图片');
      return;
    }
    updateProduct(selectedRecord.id, (current) => ({
      ...current,
      colorImage: colorForm.colorImage,
      colorConfirmedAt: formatDateTime(),
      status: '待收货',
    }));
    emitEvent('on_confirm_proofing_color', {
      proofing_id: selectedRecord.id,
      color_image: colorForm.colorImage,
    });
    closeAllActionModals();
    showToast(`打板单 ${selectedRecord.id} 已完成颜色确认`);
  };

  const handleReceiveConfirm = () => {
    if (!receiveTargetId) return;
    updateProduct(receiveTargetId, (current) => ({
      ...current,
      receivedBy: operatorName,
      receivedAt: formatDateTime(),
      status: '已收货',
    }));
    emitEvent('on_mark_proofing_received', {
      proofing_id: receiveTargetId,
    });
    setReceiveTargetId('');
    showToast(`打板单 ${receiveTargetId} 已标记为已收货`);
  };

  const handleShipToCustomerSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRecord) return;
    if (!shipToCustomerForm.courierCompany || !shipToCustomerForm.trackingNumber || !shipToCustomerForm.courierFee) {
      showToast('请填写快递公司、运单号和快递费');
      return;
    }
    updateProduct(selectedRecord.id, (current) => ({
      ...current,
      courierCompany: shipToCustomerForm.courierCompany,
      trackingNumber: shipToCustomerForm.trackingNumber,
      courierFee: shipToCustomerForm.courierFee,
      customerShippedAt: formatDateTime(),
    }));
    emitEvent('on_ship_to_customer', {
      proofing_id: selectedRecord.id,
      courier_company: shipToCustomerForm.courierCompany,
      tracking_number: shipToCustomerForm.trackingNumber,
      courier_fee: shipToCustomerForm.courierFee,
    });
    closeAllActionModals();
    showToast(`打板单 ${selectedRecord.id} 已寄送给客户`);
  };

  const handleDiscardConfirm = () => {
    if (!discardTargetId) return;
    updateProduct(discardTargetId, (current) => ({
      ...current,
      postReceiptStatus: '已废弃',
    }));
    emitEvent('on_discard_proofing_product', {
      proofing_id: discardTargetId,
    });
    setDiscardTargetId('');
    showToast(`打板单 ${discardTargetId} 已废弃`);
  };

  const handleRework = (record: ProofingRecord) => {
    const nextId = generateProofingId(proofingProducts);
    const nextRecord: ProofingRecord = {
      ...record,
      id: nextId,
      status: '待打板',
      supplierId: '',
      supplierName: '',
      supplierPrice: '',
      purchaseConfirmedAt: '',
      styleImage: '',
      styleConfirmedAt: '',
      colorImage: '',
      colorConfirmedAt: '',
      receivedAt: '',
      confirmationMethod: '',
      courierCompany: '',
      trackingNumber: '',
      courierFee: '',
      gallery: [],
      finalProductId: '',
      convertedAt: '',
      originalProofingId: record.id,
      reworkCount: (record.reworkCount || 0) + 1,
      createdAt: formatDateTime(),
      createdBy: operatorName,
      customerShippedAt: '',
      receivedBy: '',
      postReceiptStatus: '未转正品',
    };
    setProofingProducts((current) => [nextRecord, ...current]);
    emitEvent('on_rework_proofing_product', {
      from_proofing_id: record.id,
      new_proofing_id: nextId,
    });
    showToast(`已从 ${record.id} 发起重打，新单号 ${nextId}`);
    openDetailDrawer(nextId);
  };

  const handleConvertSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRecord) return;
    if (convertForm.gallery.length === 0) {
      showToast('请至少上传一张图库图片');
      return;
    }
    updateProduct(selectedRecord.id, (current) => ({
      ...current,
      gallery: convertForm.gallery,
      convertedAt: formatDateTime(),
      postReceiptStatus: '已转正品',
    }));
    emitEvent('on_convert_proofing_product', {
      proofing_id: selectedRecord.id,
      gallery: convertForm.gallery,
    });
    closeAllActionModals();
    showToast(`打板单 ${selectedRecord.id} 已转为正品`);
  };

  useImperativeHandle(
    ref,
    () => ({
      getVar(name: string) {
        switch (name) {
          case 'proofing_product_count':
            return proofingProducts.length;
          case 'pending_purchase_count':
            return pendingPurchaseCount;
          case 'selected_proofing_id':
            return selectedProofingId;
          case 'selected_category':
            return selectedCategory;
          default:
            return undefined;
        }
      },
      fireAction(name: string) {
        if (name === 'refresh_list') {
          resetFilters();
        }
      },
      eventList: EVENT_LIST,
      actionList: ACTION_LIST,
      varList: VAR_LIST,
      configList: CONFIG_LIST,
      dataList: DATA_LIST,
    }),
    [pendingPurchaseCount, proofingProducts.length, selectedCategory, selectedProofingId],
  );

  return (
    <div className="crm-presale-product-shell">
      <div className="crm-presale-product-logo">
        <div className="crm-presale-product-logo-mark" aria-hidden="true">
          <span />
        </div>
        <span className="crm-presale-product-logo-text">CLEARAL</span>
      </div>

      <header className="crm-presale-product-topbar">
        <div className="crm-presale-product-topbar-left">
          <button className="crm-presale-product-icon-button" type="button" aria-label="展开菜单">
            <Menu size={16} />
          </button>
          <div className="crm-presale-product-breadcrumb">
            <span>产品管理</span>
            <ChevronRight size={12} />
            <span>打板产品</span>
          </div>
        </div>
        <div className="crm-presale-product-topbar-right">
          <span className="crm-presale-product-operator">{operatorName}</span>
          <div className="crm-presale-product-avatar" aria-hidden="true">
            <span>{operatorName.slice(0, 1)}</span>
          </div>
        </div>
      </header>

      <aside className="crm-presale-product-sidebar">
        <nav className="crm-presale-product-nav">
          {NAV_GROUPS.map((group) => (
            <div className="crm-presale-product-nav-group" key={group.label}>
              <button className="crm-presale-product-nav-parent" type="button">
                <span className="crm-presale-product-nav-parent-label">
                  {group.icon}
                  <span>{group.label}</span>
                </span>
                {group.items ? <ChevronDown size={12} /> : null}
              </button>
              {group.items ? (
                <div className="crm-presale-product-nav-children">
                  {group.items.map((item) => (
                    <button
                      className={`crm-presale-product-nav-child${item.label === '打板产品' ? ' is-active' : ''}`}
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

      <main className="crm-presale-product-main">
        <div className="crm-presale-product-card">
          <div className="crm-presale-product-cat-sidebar">
            {['全部', ...categories].map((category) => (
              <button
                className={`crm-presale-product-cat-item${selectedCategory === category ? ' is-active' : ''}`}
                key={category}
                type="button"
                onClick={() => handleCategorySelect(category)}
              >
                <span className="cat-label">{category}</span>
                <span className="cat-count">{categoryCounts[category] ?? 0}</span>
              </button>
            ))}
          </div>

          <div className="crm-presale-product-card-content">
            <div className="crm-presale-product-page-header">
              <div>
                <h1 className="crm-presale-product-page-title">打板产品管理</h1>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="crm-presale-product-secondary-button" type="button" onClick={resetFilters}>
                  <RefreshCcw size={13} />
                  重置
                </button>
                <button className="crm-presale-product-primary-button" type="button" onClick={() => setShowCreateModal(true)}>
                  <Plus size={13} />
                  新建打板产品
                </button>
              </div>
            </div>

            <div className="crm-presale-product-filter-bar">
              <div className="crm-presale-product-filter-group">
                {STATUS_PILLS.map((status) => (
                  <button
                    className={`crm-presale-product-filter-pill${statusFilter === status ? ' is-active' : ''}`}
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status}（{statusCounts[status] ?? 0}）
                  </button>
                ))}
              </div>
              <div className="crm-presale-product-filter-spacer" />
              <div className="crm-presale-product-filter-selects">
                <select
                  aria-label="按正品状态筛选"
                  className="crm-presale-product-select"
                  value={productStatusFilter}
                  onChange={(event) => setProductStatusFilter(event.target.value as ProductStatusFilter)}
                >
                  {PRODUCT_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option === '全部' ? '正品状态：全部' : `正品状态：${option}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="crm-presale-product-search-field">
                <Search size={14} />
                <input
                  placeholder="搜索打板ID、需求描述、客户、供应商"
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                />
              </div>
            </div>

            <div className="crm-presale-product-table-wrap">
              {filteredProducts.length === 0 ? (
                <div className="crm-presale-product-empty-state">
                  <AlertTriangle size={32} />
                  <strong>暂无匹配的打板产品</strong>
                  <p>可调整分类、状态或搜索条件后重试。</p>
                </div>
              ) : (
                <table className="crm-presale-product-table">
                  <thead>
                    <tr>
                      <th>打板ID</th>
                      <th>图片</th>
                      <th>分类</th>
                      <th>打板类型</th>
                      <th>客户</th>
                      <th>期望完成</th>
                      <th>状态</th>
                      <th>供应商 / 打板价</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((record) => {
                      const showReceiptStatus = shouldShowReceiptStatus(record);
                      const receiptStatus = getReceiptStatus(record);
                      const shippingStatus = getShippingStatus(record);

                      return (
                        <tr
                          className={selectedProofingId === record.id ? 'is-selected' : ''}
                          key={record.id}
                        >
                          <td className="col-id">
                            <div className="crm-presale-product-id-stack">
                              <strong>{record.id}</strong>
                            </div>
                          </td>
                          <td>
                            <img
                              alt={record.id}
                              className="crm-presale-product-table-thumb is-clickable"
                              src={getRecordImage(record)}
                              onClick={() => openDetailDrawer(record.id)}
                              onError={handleImgError}
                            />
                          </td>
                          <td>{record.category}</td>
                          <td>
                            <span className={`crm-presale-product-type-tag${record.proofingType === '客户打板' ? ' is-customer' : ''}`}>
                              {record.proofingType}
                            </span>
                          </td>
                          <td>{record.id === 'DB202604008' ? '' : record.customerName || '内部开发'}</td>
                          <td>{record.expectedFinishDate || '-'}</td>
                          <td>
                            <div className="crm-presale-product-status-stack">
                              {!showReceiptStatus ? (
                                <div className="crm-presale-product-status-line">
                                  <span className="status-label">打板状态</span>
                                  <span className={`crm-presale-product-status-badge ${getLifecycleStatusBadgeClass(record.status)}`}>
                                    {record.status}
                                  </span>
                                </div>
                              ) : null}
                              {showReceiptStatus ? (
                                <div className="crm-presale-product-status-line">
                                  <span className="status-label">收货状态</span>
                                  <span className={`crm-presale-product-status-badge ${getReceiptStatusBadgeClass(receiptStatus)}`}>
                                    {receiptStatus}
                                  </span>
                                </div>
                              ) : null}
                              <div className="crm-presale-product-status-line">
                                <span className="status-label">正品状态</span>
                                <span className={`crm-presale-product-status-badge ${getProductStatusBadgeClass(record.postReceiptStatus)}`}>
                                  {record.postReceiptStatus}
                                </span>
                              </div>
                              {hasShippedToCustomer(record) ? (
                                <div className="crm-presale-product-status-line">
                                  <span className="status-label">寄送标记</span>
                                  <span className={`crm-presale-product-status-badge ${getShippingStatusBadgeClass(shippingStatus)}`}>
                                    {shippingStatus}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </td>
                          <td>
                            <div className="crm-presale-product-table-meta">
                              <span>{record.supplierName || '待供应商确认'}</span>
                              <span>{record.supplierPrice ? formatMoney(record.supplierPrice) : '-'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="crm-presale-product-table-actions">
                              <button className="crm-presale-product-action-btn" type="button" onClick={() => openDetailDrawer(record.id)}>
                                详情
                              </button>
                              {record.status === '待打板' ? (
                                <button className="crm-presale-product-primary-button" type="button" onClick={() => openPurchaseModal(record)}>
                                  供应商确认
                                </button>
                              ) : null}
                              {record.status === '打板中' ? (
                                <button className="crm-presale-product-action-btn" type="button" onClick={() => openStyleModal(record)}>
                                  确认样式
                                </button>
                              ) : null}
                              {record.status === '待确认颜色' ? (
                                <button className="crm-presale-product-action-btn" type="button" onClick={() => openColorModal(record)}>
                                  确认颜色
                                </button>
                              ) : null}
                              {canMarkReceived(record) ? (
                                <button
                                  className="crm-presale-product-action-btn"
                                  type="button"
                                  onClick={() => setReceiveTargetId(record.id)}
                                >
                                  标记已收货
                                </button>
                              ) : null}
                              {canShipToCustomer(record) ? (
                                <button
                                  className="crm-presale-product-action-btn"
                                  type="button"
                                  onClick={() => openShipToCustomerModal(record)}
                                >
                                  寄送给客户
                                </button>
                              ) : null}
                              {canConvert(record) ? (
                                <button className="crm-presale-product-warn-button" type="button" onClick={() => openConvertModal(record)}>
                                  转正品
                                </button>
                              ) : null}
                              {canRework(record) ? (
                                <button className="crm-presale-product-secondary-button" type="button" onClick={() => handleRework(record)}>
                                  发起重打
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      {showDetailDrawer && selectedRecord ? (
        <>
          <div className="crm-presale-product-drawer-mask" onClick={() => setShowDetailDrawer(false)} aria-hidden="true" />
          <aside className="crm-presale-product-drawer" aria-label="打板详情">
            <div className="crm-presale-product-drawer-header">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1, minWidth: 0 }}>
                <img
                  alt={selectedRecord.id}
                  className="crm-presale-product-drawer-header-thumb"
                  src={getRecordImage(selectedRecord)}
                  onClick={() => setLightboxImage(getRecordImage(selectedRecord))}
                  onError={handleImgError}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="crm-presale-product-drawer-title-row">
                    <h2>{selectedRecord.id}</h2>
                    <span className={`crm-presale-product-status-badge ${getLifecycleStatusBadgeClass(selectedRecord.status)}`}>
                      {selectedRecord.status}
                    </span>

                    {shouldShowReceiptStatus(selectedRecord) ? (
                      <>

                        {hasShippedToCustomer(selectedRecord) ? (
                          <span className={`crm-presale-product-status-badge ${getShippingStatusBadgeClass(getShippingStatus(selectedRecord))}`}>
                            {getShippingStatus(selectedRecord)}
                          </span>
                        ) : null}
                      </>
                    ) : null}
                    <span className={`crm-presale-product-type-tag${selectedRecord.proofingType === '客户打板' ? ' is-customer' : ''}`}>
                      {selectedRecord.proofingType}
                    </span>
                  </div>
                  <div className="crm-presale-product-drawer-basic-meta">
                    <span>创建人：{selectedRecord.createdBy || '-'} · {selectedRecord.createdAt || '-'}</span>
                    <span className="basic-meta-sep">|</span>
                    <span>期望完成：{selectedRecord.expectedFinishDate || '-'}</span>
                  </div>
                  <p className="crm-presale-product-drawer-copy">
                    {selectedRecord.requestDescription || '暂无需求描述'}
                  </p>
                  {selectedRecord.proofingType === '客户打板' ? (
                    <div className="crm-presale-product-drawer-meta-row">
                      <div className="meta-inline-label">客户与物流</div>
                      <div className="meta-inline-items">
                        <span>客户：{selectedRecord.customerName || '-'}</span>
                        <span className="meta-inline-sep">|</span>
                        <span>打板费：{selectedRecord.proofingFee ? formatMoney(selectedRecord.proofingFee) : '-'}</span>
                        <span className="meta-inline-sep">|</span>
                        <span>快递：{selectedRecord.courierCompany || '-'}</span>
                        <span className="meta-inline-sep">|</span>
                        <span>运单：{selectedRecord.trackingNumber || '-'}</span>
                        <span className="meta-inline-sep">|</span>
                        <span>运费：{selectedRecord.courierFee ? formatMoney(selectedRecord.courierFee) : '-'}</span>
                      </div>
                    </div>
                  ) : null}
                  {selectedRecord.postReceiptStatus === '已转正品' ? (
                    <div className="crm-presale-product-drawer-meta-row">
                      <div className="meta-inline-label">转正信息</div>
                      <div className="meta-inline-items">
                        <span>编号：{selectedRecord.finalProductId || '-'}</span>
                        <span className="meta-inline-sep">|</span>
                        <span>时间：{selectedRecord.convertedAt || '-'}</span>
                        {selectedRecord.gallery.length > 0 ? (
                          <>
                            <span className="meta-inline-sep">|</span>
                            <span className="meta-inline-gallery">
                              图库
                              {selectedRecord.gallery.slice(0, 3).map((image, index) => (
                                <button
                                  className="crm-presale-product-drawer-meta-gallery-thumb"
                                  key={`${image.slice(0, 18)}-${index}`}
                                  onClick={() => setLightboxImage(image)}
                                  type="button"
                                >
                                  <img alt={`正品图库 ${index + 1}`} src={image} onError={handleImgError} />
                                </button>
                              ))}
                              <small>共 {selectedRecord.gallery.length} 张</small>
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="meta-inline-sep">|</span>
                            <span>图库：未上传</span>
                          </>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              <button className="crm-presale-product-icon-button" type="button" onClick={() => setShowDetailDrawer(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="crm-presale-product-drawer-body">

              {/* 2. 状态时间轴 */}
              <div className="crm-presale-product-drawer-panel">
                <div className="crm-presale-product-section-title">状态时间轴</div>
                <div className="crm-presale-product-timeline">
                  {(() => {
                    const activeIndex = getStageCompletedIndex(selectedRecord);
                    return DISPLAY_TIMELINE.slice(0, activeIndex + 1).map((status, index) => {
                      const isCompleted = index < activeIndex;
                      const isCurrent = index === activeIndex;
                      return (
                        <div className={`crm-presale-product-timeline-item${isCompleted ? ' is-completed' : ''}${isCurrent ? ' is-current' : ''}`} key={status}>
                          <div className="timeline-dot">{isCompleted ? <Check size={12} /> : index + 1}</div>
                          <div className="timeline-copy">
                            <strong>{status}</strong>
                            {status !== '已收货' ? <span>{getTimelineSummary(selectedRecord, status)}</span> : null}
                            {isCompleted ? renderTimelineStageDetail(selectedRecord, status, (image) => setLightboxImage(image)) : null}
                          </div>
                        </div>
                      );
                    });
                  })()}
                  {selectedRecord.postReceiptStatus === '已废弃' || selectedRecord.status === '已废弃' ? (
                    <div className="crm-presale-product-timeline-item is-discarded">
                      <div className="timeline-dot">
                        <X size={12} />
                      </div>
                      <div className="timeline-copy">
                        <strong>已废弃</strong>
                        <span>该打板任务已终止，可从当前记录发起重打</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

            </div>

            <div className="crm-presale-product-drawer-footer-bar">
              <div className="crm-presale-product-drawer-actions">
                {selectedRecord.status === '待打板' ? (
                  <button className="crm-presale-product-primary-button" type="button" onClick={() => openPurchaseModal(selectedRecord)}>
                    <CircleDollarSign size={13} />
                    供应商确认
                  </button>
                ) : null}
                {selectedRecord.status === '打板中' ? (
                  <button className="crm-presale-product-primary-button" type="button" onClick={() => openStyleModal(selectedRecord)}>
                    确认样式
                  </button>
                ) : null}
                {selectedRecord.status === '待确认颜色' ? (
                  <button className="crm-presale-product-primary-button" type="button" onClick={() => openColorModal(selectedRecord)}>
                    上传颜色图并确认
                  </button>
                ) : null}
                {canMarkReceived(selectedRecord) ? (
                  <button className="crm-presale-product-primary-button" type="button" onClick={() => setReceiveTargetId(selectedRecord.id)}>
                    标记已收货
                  </button>
                ) : null}
                {canShipToCustomer(selectedRecord) ? (
                  <button className="crm-presale-product-primary-button" type="button" onClick={() => openShipToCustomerModal(selectedRecord)}>
                    寄送给客户
                  </button>
                ) : null}
                {canConvert(selectedRecord) ? (
                  <button className="crm-presale-product-warn-button" type="button" onClick={() => openConvertModal(selectedRecord)}>
                    <Upload size={13} />
                    转正品
                  </button>
                ) : null}
                {canDiscard(selectedRecord) ? (
                  <button className="crm-presale-product-danger-button" type="button" onClick={() => setDiscardTargetId(selectedRecord.id)}>
                    <X size={13} />
                    废弃
                  </button>
                ) : null}
                {canRework(selectedRecord) ? (
                  <button className="crm-presale-product-secondary-button" type="button" onClick={() => handleRework(selectedRecord)}>
                    <RotateCcw size={13} />
                    发起重打
                  </button>
                ) : null}
              </div>
              </div>
          </aside>
        </>
      ) : null}

      {showCreateModal ? (
        <>
          <div className="crm-presale-product-modal-mask" onClick={() => setShowCreateModal(false)} aria-hidden="true" />
          <div className="crm-presale-product-modal-layer">
            <div className="crm-presale-product-modal" role="dialog" aria-modal="true" aria-labelledby="create-proofing-title">
              <div className="crm-presale-product-modal-header">
                <h3 id="create-proofing-title">新建打板产品</h3>
                <button className="crm-presale-product-icon-button" type="button" onClick={() => setShowCreateModal(false)}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="crm-presale-product-modal-body">
                  <div className="crm-presale-product-form-grid">
                    <label>
                      <span>分类 *</span>
                      <select
                        value={createForm.category}
                        onChange={(event) => setCreateForm((current) => ({ ...current, category: event.target.value }))}
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>打板类型 *</span>
                      <select
                        value={createForm.proofingType}
                        onChange={(event) =>
                          setCreateForm((current) => ({
                            ...current,
                            proofingType: event.target.value as ProofingType,
                            customerId: event.target.value === '客户打板' ? current.customerId : '',
                            proofingFee: event.target.value === '客户打板' ? current.proofingFee : '',
                          }))
                        }
                      >
                        <option value="内部开发">内部开发</option>
                        <option value="客户打板">客户打板</option>
                      </select>
                    </label>
                    {createForm.proofingType === '客户打板' ? (
                      <>
                        <label>
                          <span>客户 *</span>
                          <select
                            value={createForm.customerId}
                            onChange={(event) => setCreateForm((current) => ({ ...current, customerId: event.target.value }))}
                          >
                            <option value="">请选择客户</option>
                            {customers.map((customer) => (
                              <option key={customer.customerId} value={customer.customerId}>
                                {customer.customerName}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span>打板费用 *</span>
                          <input
                            placeholder="请输入客户打板费用"
                            value={createForm.proofingFee}
                            onChange={(event) => setCreateForm((current) => ({ ...current, proofingFee: event.target.value }))}
                          />
                        </label>
                      </>
                    ) : null}
                    <label>
                      <span>期望完成时间 *</span>
                      <input
                        type="date"
                        value={createForm.expectedFinishDate}
                        onChange={(event) => setCreateForm((current) => ({ ...current, expectedFinishDate: event.target.value }))}
                      />
                    </label>
                    <label className="is-full">
                      <span>需求描述 *</span>
                      <textarea
                        placeholder="请输入打板需求描述"
                        rows={4}
                        value={createForm.requestDescription}
                        onChange={(event) => setCreateForm((current) => ({ ...current, requestDescription: event.target.value }))}
                      />
                    </label>
                  </div>
                  <SingleImageUploader
                    hint="上传打板主图"
                    label="打板图片 *"
                    value={createForm.image}
                    onChange={(value) => setCreateForm((current) => ({ ...current, image: value }))}
                  />
                </div>
                <div className="crm-presale-product-modal-footer">
                  <button className="crm-presale-product-secondary-button" type="button" onClick={() => setShowCreateModal(false)}>
                    取消
                  </button>
                  <button className="crm-presale-product-primary-button" type="submit">
                    创建
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      ) : null}

      {showPurchaseModal && selectedRecord ? (
        <>
          <div className="crm-presale-product-modal-mask" onClick={closeAllActionModals} aria-hidden="true" />
          <div className="crm-presale-product-modal-layer">
            <div className="crm-presale-product-modal" role="dialog" aria-modal="true" aria-labelledby="purchase-proofing-title">
              <div className="crm-presale-product-modal-header">
                <h3 id="purchase-proofing-title">供应商确认</h3>
                <button className="crm-presale-product-icon-button" type="button" onClick={closeAllActionModals}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handlePurchaseSubmit}>
                <div className="crm-presale-product-modal-body">
                  <div className="crm-presale-product-highlight-card">
                    <strong>{selectedRecord.id}</strong>
                    <span>{selectedRecord.requestDescription}</span>
                  </div>
                  <div className="crm-presale-product-form-grid">
                    <label>
                      <span>供应商 *</span>
                      <select
                        value={purchaseForm.supplierId}
                        onChange={(event) => setPurchaseForm((current) => ({ ...current, supplierId: event.target.value }))}
                      >
                        {DEFAULT_SUPPLIERS.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>供应商打板价 *</span>
                      <input
                        placeholder="请输入供应商打板价"
                        value={purchaseForm.supplierPrice}
                        onChange={(event) => setPurchaseForm((current) => ({ ...current, supplierPrice: event.target.value }))}
                      />
                    </label>
                  </div>
                </div>
                <div className="crm-presale-product-modal-footer">
                  <button className="crm-presale-product-secondary-button" type="button" onClick={closeAllActionModals}>
                    取消
                  </button>
                  <button className="crm-presale-product-primary-button" type="submit">
                    确认供应商并转为打板中
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      ) : null}

      {showStyleModal && selectedRecord ? (
        <>
          <div className="crm-presale-product-modal-mask" onClick={closeAllActionModals} aria-hidden="true" />
          <div className="crm-presale-product-modal-layer">
            <div className="crm-presale-product-modal" role="dialog" aria-modal="true" aria-labelledby="style-confirm-title">
              <div className="crm-presale-product-modal-header">
                <h3 id="style-confirm-title">确认样式</h3>
                <button className="crm-presale-product-icon-button" type="button" onClick={closeAllActionModals}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleStyleSubmit}>
                <div className="crm-presale-product-modal-body">
                  <div className="crm-presale-product-highlight-card">
                    <strong>{selectedRecord.id}</strong>
                    <span>可选上传样式图片，提交后状态将进入“待确认颜色”</span>
                  </div>
                  <SingleImageUploader
                    hint="可选上传样式确认图"
                    label="样式图片（选填）"
                    value={styleForm.styleImage}
                    onChange={(value) => setStyleForm({ styleImage: value })}
                  />
                </div>
                <div className="crm-presale-product-modal-footer">
                  <button className="crm-presale-product-secondary-button" type="button" onClick={closeAllActionModals}>
                    取消
                  </button>
                  <button className="crm-presale-product-primary-button" type="submit">
                    确认样式
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      ) : null}

      {showColorModal && selectedRecord ? (
        <>
          <div className="crm-presale-product-modal-mask" onClick={closeAllActionModals} aria-hidden="true" />
          <div className="crm-presale-product-modal-layer">
            <div className="crm-presale-product-modal" role="dialog" aria-modal="true" aria-labelledby="color-confirm-title">
              <div className="crm-presale-product-modal-header">
                <h3 id="color-confirm-title">确认颜色</h3>
                <button className="crm-presale-product-icon-button" type="button" onClick={closeAllActionModals}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleColorSubmit}>
                <div className="crm-presale-product-modal-body">
                  <div className="crm-presale-product-highlight-card">
                    <strong>{selectedRecord.id}</strong>
                    <span>上传颜色图片后，状态将进入“待收货”</span>
                  </div>
                  <SingleImageUploader
                    hint="上传颜色确认图"
                    label="颜色图片 *"
                    value={colorForm.colorImage}
                    onChange={(value) => setColorForm((current) => ({ ...current, colorImage: value }))}
                  />
                </div>
                <div className="crm-presale-product-modal-footer">
                  <button className="crm-presale-product-secondary-button" type="button" onClick={closeAllActionModals}>
                    取消
                  </button>
                  <button className="crm-presale-product-primary-button" type="submit">
                    确认颜色
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      ) : null}

      {showShipToCustomerModal && selectedRecord ? (
        <>
          <div className="crm-presale-product-modal-mask" onClick={closeAllActionModals} aria-hidden="true" />
          <div className="crm-presale-product-modal-layer">
            <div className="crm-presale-product-modal" role="dialog" aria-modal="true" aria-labelledby="ship-to-customer-title">
              <div className="crm-presale-product-modal-header">
                <h3 id="ship-to-customer-title">寄送给客户</h3>
                <button className="crm-presale-product-icon-button" type="button" onClick={closeAllActionModals}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleShipToCustomerSubmit}>
                <div className="crm-presale-product-modal-body">
                  <div className="crm-presale-product-highlight-card">
                    <strong>{selectedRecord.id}</strong>
                    <span>确认寄送后，记录依然留在已收货状态，并显示“已寄送”标记</span>
                  </div>
                  <div className="crm-presale-product-form-grid">
                    <label>
                      <span>快递公司 *</span>
                      <input
                        placeholder="请输入快递公司"
                        value={shipToCustomerForm.courierCompany}
                        onChange={(event) => setShipToCustomerForm((current) => ({ ...current, courierCompany: event.target.value }))}
                      />
                    </label>
                    <label>
                      <span>运单号 *</span>
                      <input
                        placeholder="请输入运单号"
                        value={shipToCustomerForm.trackingNumber}
                        onChange={(event) => setShipToCustomerForm((current) => ({ ...current, trackingNumber: event.target.value }))}
                      />
                    </label>
                    <label>
                      <span>快递费 *</span>
                      <input
                        placeholder="请输入快递费"
                        value={shipToCustomerForm.courierFee}
                        onChange={(event) => setShipToCustomerForm((current) => ({ ...current, courierFee: event.target.value }))}
                      />
                    </label>
                  </div>
                </div>
                <div className="crm-presale-product-modal-footer">
                  <button className="crm-presale-product-secondary-button" type="button" onClick={closeAllActionModals}>
                    取消
                  </button>
                  <button className="crm-presale-product-primary-button" type="submit">
                    确认寄送
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      ) : null}

      {showConvertModal && selectedRecord ? (
        <>
          <div className="crm-presale-product-modal-mask" onClick={closeAllActionModals} aria-hidden="true" />
          <div className="crm-presale-product-modal-layer">
            <div className="crm-presale-product-modal" role="dialog" aria-modal="true" aria-labelledby="convert-proofing-title">
              <div className="crm-presale-product-modal-header">
                <h3 id="convert-proofing-title">转为正品</h3>
                <button className="crm-presale-product-icon-button" type="button" onClick={closeAllActionModals}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleConvertSubmit}>
                <div className="crm-presale-product-modal-body">
                  <div className="crm-presale-product-highlight-card">
                    <strong>{selectedRecord.id}</strong>
                    <span>转正时仅需上传图库图片，无需填写正品产品ID</span>
                  </div>
                  <MultiImageUploader
                    value={convertForm.gallery}
                    onChange={(gallery) => setConvertForm((current) => ({ ...current, gallery }))}
                  />
                </div>
                <div className="crm-presale-product-modal-footer">
                  <button className="crm-presale-product-secondary-button" type="button" onClick={closeAllActionModals}>
                    取消
                  </button>
                  <button className="crm-presale-product-primary-button" type="submit">
                    确认转正
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      ) : null}

      {discardTargetId ? (
        <>
          <div className="crm-presale-product-modal-mask" onClick={() => setDiscardTargetId('')} aria-hidden="true" />
          <div className="crm-presale-product-modal-layer">
            <div className="crm-presale-product-modal" role="dialog" aria-modal="true" style={{ width: 420 }}>
              <div className="crm-presale-product-modal-header">
                <h3>确认废弃</h3>
                <button className="crm-presale-product-icon-button" type="button" onClick={() => setDiscardTargetId('')}>
                  <X size={16} />
                </button>
              </div>
              <div className="crm-presale-product-modal-body">
                <div className="crm-presale-product-confirm-body">
                  <AlertTriangle size={28} style={{ color: '#d97706' }} />
                  <div>
                    <strong>确认将 {discardTargetId} 标记为已废弃？</strong>
                    <p>废弃后该记录不可继续推进，但可以从原单发起重打。</p>
                  </div>
                </div>
              </div>
              <div className="crm-presale-product-modal-footer">
                <button className="crm-presale-product-secondary-button" type="button" onClick={() => setDiscardTargetId('')}>
                  取消
                </button>
                <button className="crm-presale-product-danger-button" type="button" onClick={handleDiscardConfirm}>
                  确认废弃
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {receiveTargetId ? (
        <>
          <div className="crm-presale-product-modal-mask" onClick={() => setReceiveTargetId('')} aria-hidden="true" />
          <div className="crm-presale-product-modal-layer">
            <div className="crm-presale-product-modal" role="dialog" aria-modal="true" style={{ width: 420 }}>
              <div className="crm-presale-product-modal-header">
                <h3>确认收货</h3>
                <button className="crm-presale-product-icon-button" type="button" onClick={() => setReceiveTargetId('')}>
                  <X size={16} />
                </button>
              </div>
              <div className="crm-presale-product-modal-body">
                <div className="crm-presale-product-confirm-body">
                  <Truck size={28} style={{ color: '#2563eb' }} />
                  <div>
                    <strong>确认 {receiveTargetId} 已经收货？</strong>
                    <p>确认后状态将从“待收货”变更为“已收货”。</p>
                  </div>
                </div>
              </div>
              <div className="crm-presale-product-modal-footer">
                <button className="crm-presale-product-secondary-button" type="button" onClick={() => setReceiveTargetId('')}>
                  取消
                </button>
                <button className="crm-presale-product-primary-button" type="button" onClick={handleReceiveConfirm}>
                  确认收货
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {toastMessage ? (
        <div className="crm-presale-product-toast">
          <Check size={16} />
          {toastMessage}
        </div>
      ) : null}
      {lightboxImage ? (
        <div className="crm-presale-product-lightbox" onClick={() => setLightboxImage(null)} aria-hidden="true">
          <img alt="放大图片" src={lightboxImage} />
        </div>
      ) : null}
    </div>
  );
});

export default Component;
