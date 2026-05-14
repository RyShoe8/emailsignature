export type {
  SignatureProfile,
  SignatureBrand,
  SignatureTemplate,
  SignatureElement,
  RenderSignatureInput,
} from './core/types';

export {
  renderSignature,
  mergeRenderContext,
  ensureAbsolutePublicUrl,
  unwrapImageProxyUrl,
} from './core/renderer';

export {
  SOCIAL_ICON_LINKEDIN,
  SOCIAL_ICON_FACEBOOK,
  SOCIAL_ICON_INSTAGRAM,
  SOCIAL_ICON_REDDIT,
} from './core/socialIcons';

export { STANDARD_SIGNATURE_TEMPLATE } from './core/templates/standard';
export { STACKED_SIGNATURE_TEMPLATE } from './core/templates/stacked';

export {
  mockSignatureBrand,
  mockSignatureTemplate,
  defaultSignatureElements,
} from './fixtures';
