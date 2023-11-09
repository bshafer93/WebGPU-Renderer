import webpack from 'webpack';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin'
import path from 'path';
import { argv } from 'process';


let config: webpack.Configuration = {
    context: path.join(__dirname, 'src'),
    entry: {
        app: './main.ts'
    },
    devtool: 'inline-source-map',
    output: {
        filename: '[name].[contenthash].js',
        path: path.resolve(__dirname, 'dist'),
        clean:true
    },
    resolve: {
        extensions: ['.ts', '.tsx', 'js'],
        modules: [path.resolve(__dirname, 'src'), 'node_modules'],
        fallback: {
            util: require.resolve("util/")
          }
    },
    module: {
        rules: [
            {
                test: /\.ts/,
                exclude: /node_modules/,
                loader: 'ts-loader',
                options: {
                    transpileOnly: true,
                    compilerOptions: {
                        isolatedModules: true
                    }
                }
            },
            {
                test: /\.(wgsl)/,
                type: 'asset/source'
            },
            {
                test: /\.(gif|png|jpe?g|obj|mtl|gltf)$/,
                type:'asset/resource',
            }       
        ]
    },
    node: false,
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({     
            title: 'Brent Shafer: Senior Project',
            filename:'../index.html',
            template:'../indexTemplate.html'
           }),
    ],
    optimization: {
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                },
            },
        },
    }
};

/**
 * Start Build
 */
const compiler: webpack.Compiler = webpack(config);

if (!argv.reduce((prev, cur) => prev || cur === '--watch', false)) {

    compiler.run((err, stats) => {
        if (err) return console.error(err);
        console.log(stats.toJson().errors)
        if (stats.hasErrors()) {
            let statsJson = stats.toJson();
            console.log(
                'Error:' + 'Prismatic Engine failed to compile:'
            );
            for (let error of statsJson.errors) {
                console.log("Hmm"+error.message);
            }
            return;
        }
        console.log(
                'Success' +
                (' (development) ') +
                'built in ' +
                (+stats.endTime - +stats.startTime + ' ms.')
        );
    });
} else {
    compiler.watch({}, (err, stats) => {
        if (err) return console.error(err);

        if (stats.hasErrors()) {
            let statsJson = stats.toJson();
            console.log(
                'Error:' + 'Prismatic Engine failed to compile:'
            );
            for (let error of statsJson.errors) {
                console.log(error.message);
            }
            console.log('\n👀  · Watching for changes... · \n');
            return;
        }
        
        console.log(
                'Success' +
                (' (development) ') +
                'built in ' +
                (+stats.endTime - +stats.startTime + ' ms.') +
                'Watching for changes...\n'
        );
    });
}
