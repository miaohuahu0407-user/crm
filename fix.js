const fs = require('fs');
const path = 'd:/胡苗华/供应链项目/一唐/crm/src/prototypes/crm-presale-product/index.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Replace handleColorSubmit
const old1 = `  const handleColorSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRecord) return;
    if (!colorForm.colorImage) {
      showToast('请上传颜色图片');
      return;
    }
    if (selectedRecord.proofingType === '客户打板') {
      if (!colorForm.confirmationMethod) {
        showToast('客户打板需要选择确认方式');
        return;
      }
      if (colorForm.confirmationMethod === '寄实物') {
        if (!colorForm.courierCompany || !colorForm.trackingNumber || !colorForm.courierFee) {
          showToast('寄实物确认需要填写快递公司、运单号和快递费');
          return;
        }
      }
    }

    updateProduct(selectedRecord.id, (current) => ({
      ...current,
      colorImage: colorForm.colorImage,
      colorConfirmedAt: formatDateTime(),
      confirmationMethod: current.proofingType === '客户打板' ? colorForm.confirmationMethod : '',
      courierCompany:
        current.proofingType === '客户打板' && colorForm.confirmationMethod === '寄实物'
          ? colorForm.courierCompany
          : '',
      trackingNumber:
        current.proofingType === '客户打板' && colorForm.confirmationMethod === '寄实物'
          ? colorForm.trackingNumber
          : '',
      courierFee:
        current.proofingType === '客户打板' && colorForm.confirmationMethod === '寄实物'
          ? colorForm.courierFee
          : '',
      status: '待收货',
    }));
    emitEvent('on_confirm_proofing_color', {
      proofing_id: selectedRecord.id,
      color_image: colorForm.colorImage,
      confirmation_method: colorForm.confirmationMethod,
    });
    closeAllActionModals();
    showToast(\`打板单 \${selectedRecord.id} 已完成颜色确认\`);
  };`;

const new1 = `  const handleColorSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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
    showToast(\`打板单 \${selectedRecord.id} 已完成颜色确认\`);
  };`;

if (!content.includes(old1)) {
  console.log('ERROR: old1 not found');
  process.exit(1);
}
content = content.replace(old1, new1);
console.log('1. handleColorSubmit replaced');

fs.writeFileSync(path, content, 'utf8');
console.log('Done');