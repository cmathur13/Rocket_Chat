import type { IMessage } from '@rocket.chat/core-typings';
import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { isTruthy } from '../../../../../../lib/isTruthy';
import LoadingMessagesIndicator from '../../../components/body/LoadingMessagesIndicator';
import { useLegacyThreadMessageJump } from '../hooks/useLegacyThreadMessageJump';
import { useLegacyThreadMessageListScrolling } from '../hooks/useLegacyThreadMessageListScrolling';
import { useLegacyThreadMessageRef } from '../hooks/useLegacyThreadMessageRef';
import { useLegacyThreadMessages } from '../hooks/useLegacyThreadMessages';

type LegacyThreadMessageListProps = {
	mainMessage: IMessage;
	jumpTo?: string;
	onJumpTo?: (mid: IMessage['_id']) => void;
};

const LegacyThreadMessageList = ({ mainMessage, jumpTo, onJumpTo }: LegacyThreadMessageListProps): ReactElement => {
	const { messages, loading } = useLegacyThreadMessages(mainMessage._id);
	const messageRef = useLegacyThreadMessageRef();
	const { listWrapperRef: listWrapperScrollRef, listRef: listScrollRef, onScroll: handleScroll } = useLegacyThreadMessageListScrolling();
	const { parentRef: listJumpRef } = useLegacyThreadMessageJump(jumpTo, { enabled: !loading, onJumpTo });

	const listRef = useMergedRefs<HTMLElement | null>(listScrollRef, listJumpRef);
	const hideUsernames = useUserPreference<boolean>('hideUsernames');

	return (
		<div
			ref={listWrapperScrollRef}
			className={['thread-list js-scroll-thread', hideUsernames && 'hide-usernames'].filter(isTruthy).join(' ')}
			style={{ scrollBehavior: 'smooth' }}
			onScroll={handleScroll}
		>
			<ul ref={listRef} className='thread'>
				{loading ? (
					<li className='load-more'>
						<LoadingMessagesIndicator />
					</li>
				) : (
					<>
						<li key={mainMessage._id} ref={messageRef(mainMessage, -1)} />
						{messages.map((message, index) => (
							<li key={message._id} ref={messageRef(message, index)} />
						))}
					</>
				)}
			</ul>
		</div>
	);
};

export default LegacyThreadMessageList;
