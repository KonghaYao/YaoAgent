export const JSONViewer = (props: { data: any }) => {
    return (
        /** @ts-ignore */
        <andypf-json-viewer
            indent="4"
            expanded="4"
            theme="default-light"
            show-data-types="false"
            show-toolbar="false"
            expand-icon-type="circle"
            show-copy="true"
            show-size="true"
            data={JSON.stringify(props.data)}
        >
            {/* @ts-ignore */}
        </andypf-json-viewer>
    );
};
