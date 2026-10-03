#!/bin/sh
set -eu
cd "$(dirname "$0")"
mkdir -p raw tmp cache mpl-cache assets
export MPLCONFIGDIR="$PWD/mpl-cache"
.venv/bin/manimgl noesis_scenes.py SetsCartesian FunctionComposition DerivativeSecantToTangent RiemannIntegral MatrixBasisTransform JointProbability BayesianMassNormalization GaussianPrecision GradientDescentContours EntropyInformation DynamicalAttractor VariationalPosterior MarkovMessages PolicyInformation PerceptionAction -w -r 1280x720 --fps 30
.venv/bin/python build_manifest.py
