function Error({ res, err }: any) {
    return <>
        <pre>{JSON.stringify(res, null, 2)}</pre>
        <pre>{JSON.stringify(err, null, 2)}</pre>
    </>;
}

Error.getInitialProps = ({ res, err }: any) => {
    return { res, err };
};

export default Error;
