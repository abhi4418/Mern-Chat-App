export const getSender = (loggedUser , users) =>{
    if (!Array.isArray(users) || users.length < 2 || !loggedUser) return '';
    if (!users[0] || !users[1]) return '';
    if (!users[0]._id || !users[1]._id) return '';
    if (users[0]._id === loggedUser._id) {
        return users[1]?.name || '';
    } else {
        return users[0]?.name || '';
    }
}

export const getSenderFull = (loggedUser, users) =>{
    if (!Array.isArray(users) || users.length < 2 || !loggedUser) return null;
    if (!users[0] || !users[1]) return null;
    if (!users[0]._id || !users[1]._id) return null;
    return users[0]._id === loggedUser._id ? users[1] : users[0];
}

export const isSameSender = (messages, m, i, userId) => {
    return (
        i < messages.length - 1 &&
        (messages[i + 1].sender._id !== m.sender._id ||
            messages[i + 1].sender._id === undefined) &&
        messages[i].sender._id !== userId
    );
}

export const isLastMessage = (messages, i, userId) => {
    return (
        i === messages.length - 1 &&
        messages[messages.length - 1].sender._id !== userId &&
        messages[messages.length - 1].sender._id
    );
}

export const isSameSenderMargin = (messages, m, i, userId) => {
    if (
        i < messages.length - 1 &&
        messages[i + 1].sender._id === m.sender._id &&
        messages[i].sender._id !== userId
    )
        return 33;
    else if (
        (i < messages.length - 1 &&
            messages[i + 1].sender._id !== m.sender._id &&
            messages[i].sender._id !== userId) ||
        (i === messages.length - 1 && messages[i].sender._id !== userId)
    )
        return 0;
    else return "auto";
}

export const isSameUser = (messages, m, i) => {
    return i > 0 && messages[i - 1].sender._id === m.sender._id;
}