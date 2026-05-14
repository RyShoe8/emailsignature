import { notFound } from 'next/navigation';
import { connectMongoose } from '@/lib/mongoose';
import { EmployeeModel, type EmployeeDoc } from '@/models/Employee';
import { OrganizationModel } from '@/models/Organization';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';
import { renderSignatureForEmployee } from '@/lib/renderEmployeeSignature';

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function PublicSignaturePage({ params }: { params: Promise<{ previewToken: string }> }) {
  const { previewToken } = await params;
  await connectMongoose();
  const employee = await EmployeeModel.findOne({ previewToken }).lean<EmployeeDoc | null>();
  if (!employee) notFound();
  const org = await OrganizationModel.findById(employee.organizationId).lean();
  const tmpl = await SignatureTemplateModel.findOne({
    _id: employee.templateId,
    organizationId: employee.organizationId,
  }).lean();
  if (!org || !tmpl) notFound();

  const html = renderSignatureForEmployee(org as never, employee as never, tmpl as never);

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-3xl rounded-lg border bg-white p-6 shadow-sm">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
