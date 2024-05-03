import { MessageBlock } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

import { useMessageOembedMaxWidth } from '../../../views/room/contexts/MessageContext';
import type { OEmbedPreviewMetadata } from './urlPreviews/OEmbedPreviewMetadata';
import OEmbedResolver from './urlPreviews/OEmbedResolver';
import UrlPreview from './urlPreviews/UrlPreview';
import type { UrlPreviewMetadata } from './urlPreviews/UrlPreviewMetadata';
import { buildImageURL } from './urlPreviews/buildImageURL';

type OembedUrlLegacy = {
	url: string;
	meta: Record<string, string>;
	headers?: { contentLength: string } | { contentType: string } | { contentLength: string; contentType: string };
};

type PreviewTypes = 'headers' | 'oembed';

type PreviewData = {
	type: PreviewTypes;
	data: OEmbedPreviewMetadata | UrlPreviewMetadata;
};

const normalizeMeta = ({ url, meta }: OembedUrlLegacy): OEmbedPreviewMetadata => {
	const image = meta.ogImage || meta.twitterImage || meta.msapplicationTileImage || meta.oembedThumbnailUrl || meta.oembedThumbnailUrl;

	const imageHeight = meta.ogImageHeight || meta.oembedHeight || meta.oembedThumbnailHeight;
	const imageWidth = meta.ogImageWidth || meta.oembedWidth || meta.oembedThumbnailWidth;

	return Object.fromEntries(
		Object.entries({
			siteName: meta.ogSiteName || meta.oembedProviderName,
			siteUrl: meta.ogUrl || meta.oembedProviderUrl,
			title: meta.ogTitle || meta.twitterTitle || meta.title || meta.pageTitle || meta.oembedTitle,
			description: meta.ogDescription || meta.twitterDescription || meta.description,
			authorName: meta.oembedAuthorName,
			authorUrl: meta.oembedAuthorUrl,
			...(image && {
				image: {
					url: buildImageURL(url, image),
					dimensions: {
						...(imageHeight && { height: imageHeight }),
						...(imageWidth && { width: imageWidth }),
					},
				},
			}),
			url: meta.oembedUrl || url,
			type: meta.ogType || meta.oembedType,
			...(meta.oembedHtml && { html: meta.oembedHtml }),
		}).filter(([, value]) => value),
	);
};

const hasContentType = (headers: OembedUrlLegacy['headers']): headers is { contentType: string } =>
	headers ? 'contentType' in headers : false;

const getHeaderType = (headers: OembedUrlLegacy['headers']): UrlPreviewMetadata['type'] | undefined => {
	if (!hasContentType(headers)) {
		return;
	}
	if (headers.contentType.match(/image\/.*/)) {
		return 'image';
	}
	if (headers.contentType.match(/audio\/.*/)) {
		return 'audio';
	}
	if (headers.contentType.match(/video\/.*/)) {
		return 'video';
	}
};

const isValidPreviewMeta = ({
	siteName,
	siteUrl,
	authorName,
	authorUrl,
	title,
	description,
	image,
	html,
}: OEmbedPreviewMetadata): boolean =>
	!((!siteName || !siteUrl) && (!authorName || !authorUrl) && !title && !description && !image && !html);

const processMetaAndHeaders = (url: OembedUrlLegacy): PreviewData | false => {
	if (!url.headers && !url.meta) {
		return false;
	}

	const data = url.meta && Object.values(url.meta) && normalizeMeta(url);
	if (data && isValidPreviewMeta(data)) {
		return { type: 'oembed', data };
	}

	const type = getHeaderType(url.headers);
	if (!type) {
		return false;
	}

	return {
		type: 'headers',
		data: { url: url.url, type, originalType: hasContentType(url.headers) ? url.headers?.contentType : '' },
	};
};

const isPreviewData = (data: PreviewData | false): data is PreviewData => !!data;

const isMetaPreview = (_data: PreviewData['data'], type: PreviewTypes): _data is OEmbedPreviewMetadata => type === 'oembed';

type UrlPreviewsProps = { urls: OembedUrlLegacy[] };

const UrlPreviews = ({ urls }: UrlPreviewsProps): ReactElement | null => {
	const oembedWidth = useMessageOembedMaxWidth();
	const metaAndHeaders = urls.map(processMetaAndHeaders).filter(isPreviewData);

	return (
		<>
			{metaAndHeaders.map(({ type, data }, index) => {
				if (isMetaPreview(data, type)) {
					return (
						<MessageBlock width={oembedWidth} key={index}>
							<OEmbedResolver meta={data} />
						</MessageBlock>
					);
				}
				return (
					<MessageBlock width={oembedWidth} key={index}>
						<UrlPreview {...data} />
					</MessageBlock>
				);
			})}
		</>
	);
};

export default UrlPreviews;
