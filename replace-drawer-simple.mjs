import fs from 'fs';

const file = 'src/prototypes/crm-presale-product/index.tsx';
const content = fs.readFileSync(file, 'utf-8');

const startMarker = '            <div className="crm-presale-product-drawer-body">';
const endMarker = '          </aside>';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker, startIdx);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found', { startIdx, endIdx });
  process.exit(1);
}

// Find the newline before </aside> and the </div> before that
let lineStart = content.lastIndexOf('\n', endIdx);
let bodyEnd = lineStart; // This is the start of the line containing </aside>
// Go back one more line to find the </div> that closes drawer-body
let prevLineStart = content.lastIndexOf('\n', bodyEnd - 1);
const before = content.slice(0, startIdx + startMarker.length);
const after = content.slice(prevLineStart); // includes the newline before </aside> and everything after

const newBody = `

              {/* 1. 打板信息（独立身份板块） */}
              <div className="crm-presale-product-drawer-panel">
                <div className="crm-presale-product-section-title">打板信息</div>
                <div className="crm-presale-product-detail-grid">
                  <div className="detail-item">
                    <span>打板编号</span>
                    <strong>{selectedRecord.id}</strong>
                  </div>
                  <div className="detail-item">
                    <span>期望完成时间</span>
                    <strong>{selectedRecord.expectedFinishDate || '-'}</strong>
                  </div>
                  <div className="detail-item">
                    <span>创建信息</span>
                    <strong>{selectedRecord.createdBy || '-'}</strong>
                    <small>{selectedRecord.createdAt || '-'}</small>
                  </div>
                  <div className="detail-item">
                    <span>客户</span>
                    <strong>{selectedRecord.customerName || '内部开发'}</strong>
                  </div>
                  <div className="detail-item">
                    <span>打板费用</span>
                    <strong>{selectedRecord.proofingFee ? formatMoney(selectedRecord.proofingFee) : '-'}</strong>
                  </div>
                  <div className="detail-item">
                    <span>重打来源</span>
                    <strong>{selectedRecord.originalProofingId || '首单'}</strong>
                  </div>
                </div>
                <div className="crm-presale-product-image-grid" style={{ marginTop: 12 }}>
                  <div className="image-card">
                    <span>打板图片</span>
                    <img alt="打板图片" src={getRecordImage(selectedRecord)} onError={handleImgError} />
                  </div>
                </div>
                {selectedRecord.requestDescription ? (
                  <div className="crm-presale-product-note-card" style={{ marginTop: 12 }}>
                    <strong>需求描述</strong>
                    <p>{selectedRecord.requestDescription}</p>
                  </div>
                ) : null}
                {selectedRecord.note ? (
                  <div className="crm-presale-product-note-card" style={{ marginTop: 12 }}>
                    <strong>备注</strong>
                    <p>{selectedRecord.note}</p>
                  </div>
                ) : null}
              </div>

              {/* 2. 供应商确认 */}
              <div className="crm-presale-product-drawer-panel">
                <div className="crm-presale-product-section-title">供应商确认</div>
                <div className="crm-presale-product-detail-grid">
                  <div className="detail-item">
                    <span>供应商名称</span>
                    <strong>{selectedRecord.supplierName || '待供应商确认'}</strong>
                  </div>
                  <div className="detail-item">
                    <span>供应商打板价</span>
                    <strong>{selectedRecord.supplierPrice ? formatMoney(selectedRecord.supplierPrice) : '-'}</strong>
                  </div>
                  <div className="detail-item">
                    <span>确认状态</span>
                    <strong>{selectedRecord.purchaseConfirmedAt ? '已确认' : '待确认'}</strong>
                    <small>{selectedRecord.purchaseConfirmedAt || '-'}</small>
                  </div>
                  <div className="detail-item">
                    <span>分类</span>
                    <strong>{selectedRecord.category}</strong>
                  </div>
                </div>
              </div>

              {/* 3. 样式与颜色 */}
              <div className="crm-presale-product-drawer-panel">
                <div className="crm-presale-product-section-title">样式与颜色</div>
                <div className="crm-presale-product-image-grid">
                  <div className="image-card">
                    <span>样式图片</span>
                    {selectedRecord.styleImage ? <img alt="样式图片" src={selectedRecord.styleImage} onError={handleImgError} /> : <div className="image-empty">待上传</div>}
                  </div>
                  <div className="image-card">
                    <span>颜色图片</span>
                    {selectedRecord.colorImage ? <img alt="颜色图片" src={selectedRecord.colorImage} onError={handleImgError} /> : <div className="image-empty">待上传</div>}
                  </div>
                </div>
              </div>

              {/* 4. 收货信息 */}
              <div className="crm-presale-product-drawer-panel">
                <div className="crm-presale-product-section-title">收货信息</div>
                <div className="crm-presale-product-detail-grid">
                  <div className="detail-item">
                    <span>收货状态</span>
                    <strong>{shouldShowReceiptStatus(selectedRecord) ? getReceiptStatus(selectedRecord) : '-'}</strong>
                  </div>
                  <div className="detail-item">
                    <span>收货操作人</span>
                    <strong>{selectedRecord.receivedBy || '-'}</strong>
                  </div>
                  <div className="detail-item">
                    <span>收货时间</span>
                    <strong>{selectedRecord.receivedAt || '-'}</strong>
                  </div>
                  <div className="detail-item">
                    <span>确认方式</span>
                    <strong>{selectedRecord.confirmationMethod || '-'}</strong>
                  </div>
                </div>
              </div>

              {/* 5. 寄送客户 */}
              <div className="crm-presale-product-drawer-panel">
                <div className="crm-presale-product-section-title">寄送客户</div>
                <div className="crm-presale-product-detail-grid">
                  <div className="detail-item">
                    <span>快递公司</span>
                    <strong>{selectedRecord.courierCompany || '-'}</strong>
                  </div>
                  <div className="detail-item">
                    <span>运单号</span>
                    <strong>{selectedRecord.trackingNumber || '-'}</strong>
                  </div>
                  <div className="detail-item">
                    <span>快递费</span>
                    <strong>{selectedRecord.courierFee ? formatMoney(selectedRecord.courierFee) : '-'}</strong>
                  </div>
                  {selectedRecord.customerShippedAt ? (
                    <div className="detail-item">
                      <span>寄送客户时间</span>
                      <strong>{selectedRecord.customerShippedAt}</strong>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* 6. 状态时间轴 */}
              <div className="crm-presale-product-drawer-panel">
                <div className="crm-presale-product-section-title">状态时间轴</div>
                <div className="crm-presale-product-timeline">
                  {DISPLAY_TIMELINE.map((status, index) => {
                    const activeIndex = getStageCompletedIndex(selectedRecord);
                    const isCompleted = index <= activeIndex;
                    const isCurrent = selectedRecord.status === status;
                    return (
                      <div className={\`crm-presale-product-timeline-item\${isCompleted ? ' is-completed' : ''}\${isCurrent ? ' is-current' : ''}\`} key={status}>
                        <div className="timeline-dot">{isCompleted ? <Check size={12} /> : index + 1}</div>
                        <div className="timeline-copy">
                          <strong>{status}</strong>
                          <span>
                            {status === '待打板'
                              ? selectedRecord.supplierName
                                ? \`已选择 \${selectedRecord.supplierName}\`
                                : '待确认供应商与打板价'
                              : status === '打板中'
                                ? selectedRecord.styleConfirmedAt || selectedRecord.purchaseConfirmedAt || '待执行样式确认'
                                : status === '待确认颜色'
                                  ? selectedRecord.colorConfirmedAt || '待上传颜色图'
                                  : status === '已收货'
                                    ? selectedRecord.receivedAt || '待收货完成'
                                    : status === '已转正品'
                                      ? selectedRecord.convertedAt || '待转正'
                                      : '—'}
                          </span>
                          {status === '待打板' && selectedRecord.status === '待打板' ? (
                            <button
                              className="crm-presale-product-action-btn crm-presale-product-timeline-action-btn"
                              type="button"
                              onClick={() => openPurchaseModal(selectedRecord)}
                            >
                              <CircleDollarSign size={12} />
                              供应商确认
                            </button>
                          ) : null}
                          {status === '打板中' && selectedRecord.status === '打板中' ? (
                            <button
                              className="crm-presale-product-action-btn crm-presale-product-timeline-action-btn"
                              type="button"
                              onClick={() => openStyleModal(selectedRecord)}
                            >
                              确认样式
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
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

              {/* 7. 转正品（独立板块） */}
              <div className="crm-presale-product-drawer-panel">
                <div className="crm-presale-product-section-title">转正品</div>
                <div className="crm-presale-product-detail-grid">
                  <div className="detail-item">
                    <span>正品产品ID</span>
                    <strong>{selectedRecord.finalProductId || '-'}</strong>
                  </div>
                  <div className="detail-item">
                    <span>转正时间</span>
                    <strong>{selectedRecord.convertedAt || '-'}</strong>
                  </div>
                  <div className="detail-item">
                    <span>正品状态</span>
                    <strong>{selectedRecord.postReceiptStatus}</strong>
                  </div>
                </div>
                {selectedRecord.gallery.length > 0 ? (
                  <>
                    <div className="crm-presale-product-section-title" style={{ marginTop: 16 }}>正品图库</div>
                    <div className="crm-presale-product-gallery-grid">
                      {selectedRecord.gallery.map((image, index) => (
                        <div className="crm-presale-product-gallery-item is-static" key={\`\${image.slice(0, 18)}-\${index}\`}>
                          <img alt={\`图库 \${index + 1}\`} src={image} />
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>

              {/* 操作按钮区 */}
              <div className="crm-presale-product-drawer-panel" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
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
`;

const result = before + newBody + after;
fs.writeFileSync(file, result);
console.log('Replaced drawer body successfully');