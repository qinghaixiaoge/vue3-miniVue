module.exports =  {
    input: 'index.js',
    output: [
        {
            file: './dist/mini-vue.esm.js',
            format: 'es'
        }, {
            file: './dist/mini-vue.cjs.js',
            format: 'cjs'
        }
    ]
}